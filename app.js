(() => {
    const STORAGE_KEY = "users";
    const LEGACY_STORAGE_KEY = "usuarios";
    const PAGE_SIZE = 5;

    const form = document.getElementById("userForm");
    const fields = {
        fullName: document.getElementById("fullName"),
        cpf: document.getElementById("cpf"),
        cns: document.getElementById("cns"),
        email: document.getElementById("email"),
        birthDate: document.getElementById("birthDate")
    };
    const userList = document.getElementById("userList");
    const emptyState = document.getElementById("emptyState");
    const userCount = document.getElementById("userCount");
    const currentPageLabel = document.getElementById("currentPageLabel");
    const previousPageButton = document.getElementById("previousPageButton");
    const nextPageButton = document.getElementById("nextPageButton");
    const searchInput = document.getElementById("searchInput");
    const submitButton = document.getElementById("submitButton");
    const cancelButton = document.getElementById("cancelButton");
    const formTitle = document.getElementById("formTitle");
    const formHint = document.getElementById("formHint");
    const confirmDialog = document.getElementById("confirmDialog");
    const confirmMessage = document.getElementById("confirmMessage");
    const toastElement = document.getElementById("toast");

    const state = {
        users: loadUsers(),
        page: 1,
        query: "",
        editingId: null
    };

    fields.birthDate.max = todayIso();

    fields.cpf.addEventListener("input", () => {
        fields.cpf.value = maskCpf(fields.cpf.value);
    });
    fields.cns.addEventListener("input", () => {
        fields.cns.value = maskCns(fields.cns.value);
    });
    Object.values(fields).forEach((input) => {
        input.addEventListener("input", () => setFieldError(input.id, ""));
    });

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const data = readForm();
        if (!validate(data)) return;

        if (state.editingId) {
            state.users = state.users.map((user) =>
                user.id === state.editingId ? { ...user, ...data } : user
            );
            toast("Alterações salvas.");
        } else {
            state.users.unshift({ id: createId(), ...data, createdAt: Date.now() });
            state.page = 1;
            toast("Usuário cadastrado.");
        }

        persist();
        resetForm();
        render();
    });

    cancelButton.addEventListener("click", () => {
        resetForm();
        render();
    });

    searchInput.addEventListener("input", () => {
        state.query = searchInput.value.trim().toLowerCase();
        state.page = 1;
        render();
    });

    previousPageButton.addEventListener("click", () => {
        if (state.page > 1) {
            state.page -= 1;
            render();
        }
    });

    nextPageButton.addEventListener("click", () => {
        if (state.page < totalPages(filteredUsers())) {
            state.page += 1;
            render();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && state.editingId && !confirmDialog.open) {
            resetForm();
            render();
        }
    });

    render();

    function loadUsers() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
            const parsed = JSON.parse(stored || legacy || "[]");
            const users = Array.isArray(parsed) ? parsed.map(normalizeUser) : [];
            if (!stored && legacy) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
            }
            return users;
        } catch {
            document.getElementById("storageNote").textContent = "Não foi possível ler os dados salvos. A lista vale só nesta visita.";
            return [];
        }
    }

    function normalizeUser(user) {
        return {
            id: user.id,
            fullName: user.fullName || user.nome || "",
            cpf: user.cpf || "",
            cns: user.cns || "",
            email: user.email || "",
            birthDate: user.birthDate || user.nascimento || "",
            createdAt: user.createdAt || user.criadoEm || Date.now()
        };
    }

    function persist() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state.users));
        } catch {
            toast("Não foi possível salvar neste navegador.");
        }
    }

    function readForm() {
        return {
            fullName: fields.fullName.value.trim().replace(/\s+/g, " "),
            cpf: digits(fields.cpf.value),
            cns: digits(fields.cns.value),
            email: fields.email.value.trim().toLowerCase(),
            birthDate: fields.birthDate.value
        };
    }

    function validate(data) {
        const errors = {
            fullName: "",
            cpf: "",
            cns: "",
            email: "",
            birthDate: ""
        };

        const letters = data.fullName.match(/\p{L}/gu) || [];
        if (letters.length < 3 || !/^[\p{L}\s'.-]+$/u.test(data.fullName)) {
            errors.fullName = "Informe o nome completo, só com letras.";
        }
        if (!isValidCpf(data.cpf)) {
            errors.cpf = "CPF inválido.";
        } else if (state.users.some((user) => user.cpf === data.cpf && user.id !== state.editingId)) {
            errors.cpf = "Este CPF já está cadastrado.";
        }
        if (!isValidCns(data.cns)) {
            errors.cns = "CNS inválido.";
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            errors.email = "Informe um e-mail válido.";
        } else if (state.users.some((user) => user.email === data.email && user.id !== state.editingId)) {
            errors.email = "Este e-mail já está cadastrado.";
        }
        if (!data.birthDate || data.birthDate > todayIso() || data.birthDate < "1900-01-01") {
            errors.birthDate = "Informe uma data de nascimento válida.";
        }

        Object.entries(errors).forEach(([field, message]) => setFieldError(field, message));
        const firstInvalid = Object.entries(errors).find(([, message]) => message);
        if (firstInvalid) fields[firstInvalid[0]].focus();
        return !firstInvalid;
    }

    function setFieldError(field, message) {
        const input = fields[field];
        const error = document.getElementById(`${field}Error`);
        error.textContent = message;
        input.setAttribute("aria-invalid", message ? "true" : "false");
    }

    function resetForm() {
        form.reset();
        state.editingId = null;
        Object.keys(fields).forEach((field) => setFieldError(field, ""));
        submitButton.textContent = "Cadastrar";
        cancelButton.hidden = true;
        formTitle.textContent = "Novo usuário";
        formHint.textContent = "Preencha a identificação para incluir na lista.";
    }

    function startEdit(id) {
        const user = state.users.find((item) => item.id === id);
        if (!user) return;
        state.editingId = id;
        fields.fullName.value = user.fullName;
        fields.cpf.value = formatCpf(user.cpf);
        fields.cns.value = formatCns(user.cns);
        fields.email.value = user.email;
        fields.birthDate.value = user.birthDate;
        Object.keys(fields).forEach((field) => setFieldError(field, ""));
        submitButton.textContent = "Salvar alterações";
        cancelButton.hidden = false;
        formTitle.textContent = "Editar usuário";
        formHint.textContent = "Atualize os dados e salve, ou cancele para voltar.";
        fields.fullName.focus();
        render();
    }

    async function removeUser(id) {
        const user = state.users.find((item) => item.id === id);
        if (!user) return;
        confirmMessage.textContent = `Excluir ${user.fullName}? Essa ação não pode ser desfeita.`;
        confirmDialog.showModal();
        const confirmed = await new Promise((resolve) => {
            confirmDialog.addEventListener("close", () => resolve(confirmDialog.returnValue === "confirm"), { once: true });
        });
        if (!confirmed) return;
        state.users = state.users.filter((item) => item.id !== id);
        if (state.editingId === id) resetForm();
        persist();
        toast("Usuário excluído.");
        render();
    }

    function filteredUsers() {
        const queryDigits = digits(state.query);
        return state.users.filter((user) => {
            const text = `${user.fullName} ${user.email} ${formatCpf(user.cpf)} ${formatCns(user.cns)}`.toLowerCase();
            const ids = `${user.cpf}${user.cns}`;
            return text.includes(state.query) || (queryDigits.length > 0 && ids.includes(queryDigits));
        });
    }

    function totalPages(list) {
        return Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    }

    function render() {
        const list = filteredUsers();
        const pages = list.length === 0 ? 0 : totalPages(list);
        if (pages > 0 && state.page > pages) state.page = pages;

        const start = (state.page - 1) * PAGE_SIZE;
        const pageItems = list.slice(start, start + PAGE_SIZE);

        userList.replaceChildren();
        pageItems.forEach((user) => userList.append(renderRow(user)));

        const noun = list.length === 1 ? "usuário" : "usuários";
        userCount.textContent = state.query
            ? `${list.length} ${noun} encontrado${list.length === 1 ? "" : "s"}`
            : `${list.length} ${noun}`;

        emptyState.textContent = state.query
            ? "Nenhum usuário encontrado para essa busca."
            : "Nenhum usuário cadastrado. Use o formulário para incluir o primeiro.";
        emptyState.classList.toggle("show", list.length === 0);
        userList.hidden = list.length === 0;

        currentPageLabel.textContent = pages === 0 ? "Sem páginas" : `Página ${state.page} de ${pages}`;
        previousPageButton.disabled = state.page <= 1;
        nextPageButton.disabled = pages === 0 || state.page >= pages;
    }

    function renderRow(user) {
        const row = document.createElement("article");
        row.className = "user-row";
        if (user.id === state.editingId) row.classList.add("is-editing");

        const identity = document.createElement("div");
        identity.className = "identity";
        const name = document.createElement("strong");
        name.textContent = user.fullName;
        const email = document.createElement("span");
        email.textContent = user.email;
        identity.append(name, email);

        const details = document.createElement("dl");
        details.className = "details";
        [
            ["CPF", formatCpf(user.cpf)],
            ["CNS", formatCns(user.cns)],
            ["Nascimento", formatDate(user.birthDate)]
        ].forEach(([label, value]) => {
            const group = document.createElement("div");
            const term = document.createElement("dt");
            term.textContent = label;
            const description = document.createElement("dd");
            description.textContent = value;
            group.append(term, description);
            details.append(group);
        });

        const actions = document.createElement("div");
        actions.className = "actions";
        actions.append(
            actionButton("Editar", "btn btn-ghost btn-small", () => startEdit(user.id)),
            actionButton("Excluir", "btn btn-danger-text btn-small", () => removeUser(user.id))
        );

        row.append(identity, details, actions);
        return row;
    }

    function actionButton(label, className, onClick) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = className;
        button.textContent = label;
        button.addEventListener("click", onClick);
        return button;
    }

    function toast(message) {
        toastElement.textContent = message;
        toastElement.classList.add("show");
        clearTimeout(toast.timer);
        toast.timer = setTimeout(() => toastElement.classList.remove("show"), 2600);
    }

    function createId() {
        if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
            return crypto.randomUUID();
        }
        return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    function digits(value) {
        return value.replace(/\D/g, "");
    }

    function maskCpf(value) {
        const numbers = digits(value).slice(0, 11);
        return numbers
            .replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }

    function maskCns(value) {
        return formatCns(digits(value).slice(0, 15));
    }

    function formatCpf(value) {
        return value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }

    function formatCns(value) {
        return [value.slice(0, 3), value.slice(3, 7), value.slice(7, 11), value.slice(11, 15)]
            .filter(Boolean)
            .join(" ");
    }

    function formatDate(iso) {
        const [year, month, day] = iso.split("-");
        return `${day}/${month}/${year}`;
    }

    function todayIso() {
        const now = new Date();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        return `${now.getFullYear()}-${month}-${day}`;
    }

    function isValidCpf(cpf) {
        if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
        const digit = (length) => {
            const sum = cpf
                .slice(0, length)
                .split("")
                .reduce((total, char, index) => total + Number(char) * (length + 1 - index), 0);
            const result = (sum * 10) % 11;
            return result === 10 ? 0 : result;
        };
        return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10]);
    }

    // National Health Card: definitive numbers start with 1 or 2; provisional numbers start with 7, 8, or 9.
    function isValidCns(cns) {
        if (!/^\d{15}$/.test(cns)) return false;
        const first = cns[0];
        if (first === "1" || first === "2") {
            let sum = 0;
            for (let i = 0; i < 11; i += 1) sum += Number(cns[i]) * (15 - i);
            let rest = sum % 11;
            let checkDigit = 11 - rest;
            if (checkDigit === 11) checkDigit = 0;
            if (checkDigit === 10) {
                sum += 2;
                rest = sum % 11;
                checkDigit = 11 - rest;
                return checkDigit !== 11 && cns === `${cns.slice(0, 11)}001${checkDigit}`;
            }
            return cns === `${cns.slice(0, 11)}000${checkDigit}`;
        }
        if (first === "7" || first === "8" || first === "9") {
            const sum = cns.split("").reduce((total, char, index) => total + Number(char) * (15 - index), 0);
            return sum % 11 === 0;
        }
        return false;
    }
})();
