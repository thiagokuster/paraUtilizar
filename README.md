# Cadastro de usuários

Cadastro local de pessoas, com nome, CPF, CNS, e-mail e data de nascimento. A lista, a busca e a validação acontecem no navegador, e cada registro fica salvo neste computador.

## 🚀 Demo

Ainda não há uma versão publicada. Depois de abrir o projeto, use o arquivo `index.html` ou acesse [http://localhost:5500](http://localhost:5500).

## 🛠️ Tecnologias

- HTML
- CSS
- JavaScript

## ✨ Funcionalidades

- Cadastro, edição e exclusão, com confirmação antes de apagar
- Validação de nome, CPF, CNS, e-mail e data de nascimento
- Máscara de CPF e CNS enquanto a pessoa digita
- Busca por nome, documento ou e-mail
- Paginação da lista
- Dados gravados no navegador e mantidos depois de recarregar a página

## 📦 Como rodar localmente

```bash
git clone https://github.com/thiagokuster/paraUtilizar.git
cd paraUtilizar
```

Abra `index.html` no navegador. Para servir a pasta:

```bash
python -m http.server 5500
```

Não há instalação nem banco. O cadastro usa só os três arquivos `index.html`, `styles.css` e `app.js`.

## Onde os dados ficam

Os registros entram no `localStorage` deste navegador, na chave `users`. Outro navegador, outro computador ou a limpeza dos dados do site começam com a lista vazia. Não há servidor, login nem cópia automática.
