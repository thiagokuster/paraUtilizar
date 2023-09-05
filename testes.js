var selectedRow = null
const itemsPerPage = 5
let currentPage = 1

function onFormSubmit() {
    if (validate()) {
        var formData = readformData();
        if (selectedRow == null)
            insertNewRecord(formData);
        else
            updateRecord(formData);
        resetForm();
    }
}
function readformData() {
    var formData = {};
    formData["nome"] = document.getElementById("nome").value
    formData["cpf"] = document.getElementById("cpf").value
    formData["cns"] = document.getElementById("cns").value
    formData["email"] = document.getElementById("email").value
    formData["ddn"]=document.getElementById("ddn").value
    return formData;
}
function insertNewRecord(data) {
    var table = document.getElementById("employeeList").getElementsByTagName('tbody')[0];
    var newRow = table.insertRow(table.length)
    cell1 = newRow.insertCell(0)
    cell1.innerHTML = data.nome
    cell2 = newRow.insertCell(1)
    cell2.innerHTML = data.cpf
    cell3 = newRow.insertCell(2)
    cell3.innerHTML = data.cns
    cell4 = newRow.insertCell(3)
    cell4.innerHTML = data.email
    cell5 = newRow.insertCell(4)
    cell5.innerHTML = data.ddn
    cell5 = newRow.insertCell(5)
    cell5.innerHTML = `<a onClick="onEdit(this)">Edit</a> <a onClick="onDelete(this)">Delete</a>`
}
function resetForm() {
    document.getElementById("nome").value = ""
    document.getElementById("cpf").value = ""
    document.getElementById("cns").value = ""
    document.getElementById("email").value = ""
    document.getElementById("ddn").value = ""
    selectedRow = null;
}
function onEdit(td) {
    selectedRow = td.parentElement.parentElement;
    document.getElementById("nome").value = selectedRow.cells[0].innerHTML
    document.getElementById("cpf").value = selectedRow.cells[1].innerHTML
    document.getElementById("cns").value = selectedRow.cells[2].innerHTML
    document.getElementById("email").value = selectedRow.cells[3].innerHTML
    document.getElementById("ddn").value = selectedRow.cells[4].innerHTML
}
function updateRecord(formData) {
    selectedRow.cells[0].innerHTML = formData.nome
    selectedRow.cells[1].innerHTML = formData.cpf
    selectedRow.cells[2].innerHTML = formData.cns
    selectedRow.cells[3].innerHTML = formData.email
    selectedRow.cells[4].innerHTML=formData.ddn
}
function onDelete(td) {
    if (confirm('Realmente deseja apagar o usuario?')) {
        row = td.parentElement.parentElement;
        document.getElementById("employeeList").deleteRow(row.rowIndex);
        resetForm();
    }
}
function validate() {
    isValid = true;
    if (document.getElementById("nome").value == "") {
        isValid = false;
        document.getElementById("fullNameValidationError").classList.remove("hide");
    } else {
        isValid = true;
        if (!document.getElementById("fullNameValidationError").classList.contains("hide"))
            document.getElementById("fullNameValidationError").classList.add("hide");
    }
    return isValid;
}
function updateTable() {
    const tableRows = document.querySelectorAll('#employeeList tbody tr')
    const totalPages = Math.ceil(tableRows.length / itemsPerPage)
    tableRows.forEach((row, index) => {
        if (index >= (currentPage - 1) * itemsPerPage && index < currentPage * itemsPerPage) {
            row.style.display = 'table-row'
        } else {
            row.style.display = 'none'
        }
    })
    const currentPageElement = document.getElementById('currentPage');
    if (currentPageElement) {
        currentPageElement.textContent = `Página ${currentPage} de ${totalPages}`;
    }
}
document.getElementById('previousPage').addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--
        updateTable()
    }
})
document.getElementById('nextPage').addEventListener('click', () => {
    const tableRows = document.querySelectorAll('#employeeList tbody tr')
    const totalPages = Math.ceil(tableRows.length / itemsPerPage)
    if (currentPage < totalPages) {
        currentPage++
        updateTable()
    }
})
updateTable()