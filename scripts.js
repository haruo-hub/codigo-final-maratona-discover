const Utils = {
  formatAmount(value) {
    value = Number(value) * 100;
    return value;
  },

  formatDate(date) {
    const splittedDate = date.split("-");
    return `${splittedDate[2]}/${splittedDate[1]}/${splittedDate[0]}`;
  },

  parseDate(dateString) {
    let dateStringSplitted = dateString.split("/");
    return new Date(
      dateStringSplitted[2],
      dateStringSplitted[1] - 1,
      dateStringSplitted[0]
    );
  },

  parseAmount(stringAmount) {
    const signal = Number(stringAmount) < 0 ? "-" : "";
    let value = String(stringAmount).replace(/\D/g, "");
    return Number(signal+value);
  },

  formatCurrency(value) {
    const signal = Number(value) < 0 ? "-" : "";

    value = String(value).replace(/\D/g, "");

    value = Number(value) / 100;

    value = value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

    return signal + value;
  },

  compareStringsAsc(stringOne, stringTwo) {
    return stringOne.localeCompare(stringTwo);
  },

  compareStringsDesc(stringOne, stringTwo) {
    return Utils.compareStringsAsc(stringOne, stringTwo)*-1;
  },

  compareNumberAsc(stringNumberOne, stringNumberTwo) {
    let numberOne = Utils.parseAmount(stringNumberOne);
    let numberTwo = Utils.parseAmount(stringNumberTwo);
    let result = 0;
    if (numberOne > numberTwo) result = -1;
    if (numberOne < numberTwo) result = 1;
    return result;
  },

  compareNumberDesc(stringNumberOne, stringNumberTwo) {
    return Utils.compareNumberAsc(stringNumberOne, stringNumberTwo) * -1;
  },

  compareDateAsc(stringDateOne, stringDateTwo) {
    let dateOne = Utils.parseDate(stringDateOne);
    let dateTwo = Utils.parseDate(stringDateTwo);
    let result = 0;
    if (dateOne < dateTwo) result = -1;
    if (dateOne > dateTwo) result = 1;
    return result;
  },

  compareDateDesc(stringDateOne, stringDateTwo) {
    return Utils.compareDateAsc(stringDateOne, stringDateTwo) * -1;
  },
};

const OrderByTypeUtils = {
  mapFunctionsOrderString: new Map([
    ["asc", Utils.compareStringsAsc],
    ["desc", Utils.compareStringsDesc],
  ]),

  mapFunctionsOrderNumber: new Map([
    ["asc", Utils.compareNumberAsc],
    ["desc", Utils.compareNumberDesc],
  ]),

  mapFunctionsOrderDate: new Map([
    ["asc", Utils.compareDateAsc],
    ["desc", Utils.compareDateDesc],
  ]),
};

const OrderUtils = {
  mapFunctionsOrderTypes: new Map([
    ["string", OrderByTypeUtils.mapFunctionsOrderString],
    ["number", OrderByTypeUtils.mapFunctionsOrderNumber],
    ["date", OrderByTypeUtils.mapFunctionsOrderDate],
  ]),
};

const Form = {
  description: document.querySelector("input#description"),
  amount: document.querySelector("input#amount"),
  date: document.querySelector("input#date"),

  getValues() {
    return {
      description: Form.description.value,
      amount: Form.amount.value,
      date: Form.date.value,
    };
  },

  validateFields() {
    const { description, amount, date } = Form.getValues();

    if (
      description.trim() === "" ||
      amount.trim() === "" ||
      date.trim() === ""
    ) {
      throw new Error("Por favor, preencha todos os campos");
    }
  },

  formatValues() {
    let { description, amount, date } = Form.getValues();

    amount = Utils.formatAmount(amount);

    date = Utils.formatDate(date);

    return {
      description,
      amount,
      date,
    };
  },

  clearFields() {
    Form.description.value = "";
    Form.amount.value = "";
    Form.date.value = "";
  },

  submit(event) {
    event.preventDefault();

    try {
      Form.validateFields();
      const transaction = Form.formatValues();
      const resultValidation = Transaction.validate(transaction);
      if (resultValidation.isValidated) {
        Transaction.add(transaction);
        Form.clearFields();
        Modal.close();
      } else {
        alert(resultValidation.message);
      }
    } catch (error) {
      alert(error.message);
    }
  },
};

const Modal = {
  open() {
    // Abrir modal
    // Adicionar a class active ao modal
    document.querySelector(".modal-overlay").classList.add("active");
  },
  close() {
    // fechar o modal
    // remover a class active do modal
    document.querySelector(".modal-overlay").classList.remove("active");
  },
};

const Storage = {
  get() {
    return JSON.parse(localStorage.getItem("dev.finances:transactions")) || [];
  },

  set(transactions) {
    localStorage.setItem(
      "dev.finances:transactions",
      JSON.stringify(transactions)
    );
  },
};

const Transaction = {
  all: Storage.get(),
  propertyTypes: new Map([["amount", "number"],["description", "string"],["date", "date"]]),

  add(transaction) {
    Transaction.all.push(transaction);
    App.reload();
  },

  remove(index) {
    Transaction.all.splice(index, 1);
    App.reload();
  },

  validate(transaction) {
    let result = { isValidated: true, message: "" };
    const isTransactionDuplicated = Transaction.isTransactionDuplicated(
      transaction
    );
    if (isTransactionDuplicated) {
      result.isValidated = false;
      result.message +=
        "Transação já incluída. \nPor favor, informe uma transação com informações diferentes!";
    }
    return result;
  },

  isTransactionDuplicated(verifiedTransaction) {
    let result = false;
    let transactionDuplicated = Transaction.findTransaction(
      verifiedTransaction
    );
    if (transactionDuplicated.length > 0) {
      result = true;
    }
    return result;
  },

  findTransaction(searchTransaction) {
    return Transaction.all.filter(
      (transaction) =>
        searchTransaction.description === transaction.description &&
        searchTransaction.amount === transaction.amount &&
        searchTransaction.date === transaction.date
    );
  },

  incomes() {
    let income = 0;
    Transaction.all.forEach((transaction) => {
      if (transaction.amount > 0) {
        income += transaction.amount;
      }
    });
    return income;
  },

  expenses() {
    let expense = 0;
    Transaction.all.forEach((transaction) => {
      if (transaction.amount < 0) {
        expense += transaction.amount;
      }
    });
    return expense;
  },

  total() {
    return Transaction.incomes() + Transaction.expenses();
  },




  order(property, order) {
    let propertyOrderFunctions = OrderUtils.mapFunctionsOrderTypes.get(Transaction.propertyTypes.get(property));
    if (order === "asc-order") {
      Transaction.all.sort((firstTransaction, secondTransaction) => {
        return propertyOrderFunctions.get("asc")(
          firstTransaction[property],
          secondTransaction[property]
        );
      });
      App.reload();
    } else if (order === "desc-order") {
      Transaction.all.sort((firstTransaction, secondTransaction) => {
        return propertyOrderFunctions.get("desc")(
          firstTransaction[property],
          secondTransaction[property]
        );
      });
      App.reload();
    }
  },

  ascendingOrder(property) {
    Transaction.all.sort((firstTransaction, secondTransaction) => {
      let result = 0;
      if (firstTransaction[property] < secondTransaction[property]) result = -1;
      if (firstTransaction[property] > secondTransaction[property]) result = 1;
      return result;
    });
  },

  descendingOrder(property) {
    Transaction.all.sort((firstTransaction, secondTransaction) => {
      let result = 0;
      if (firstTransaction[property] > secondTransaction[property]) result = -1;
      if (firstTransaction[property] < secondTransaction[property]) result = 1;
      return result;
    });
  },
};

const DOM = {
  transactionsContainer: document.querySelector("#data-table tbody"),

  addTransaction(transaction, index) {
    const tr = document.createElement("tr");
    tr.innerHTML = DOM.innerHTMLTransaction(transaction, index);
    tr.dataset.index = index;
    DOM.transactionsContainer.appendChild(tr);
  },

  innerHTMLTransaction(transaction, index) {
    const cssClass = transaction.amount > 0 ? "income" : "expense";

    const amount = Utils.formatCurrency(transaction.amount);

    const html = `
        <td class="description">${transaction.description}</td>
        <td class="${cssClass}">${amount}</td>
        <td class="date">${transaction.date}</td>
        <td>
            <img onclick="Transaction.remove(${index})" src="./assets/minus.svg" alt="Remover transação">
        </td>
        `;

    return html;
  },

  updateBalance() {
    document.getElementById("incomeDisplay").innerHTML = Utils.formatCurrency(
      Transaction.incomes()
    );
    document.getElementById("expenseDisplay").innerHTML = Utils.formatCurrency(
      Transaction.expenses()
    );
    document.getElementById("totalDisplay").innerHTML = Utils.formatCurrency(
      Transaction.total()
    );
  },

  clearTransactions() {
    DOM.transactionsContainer.innerHTML = "";
  },

  orderByColumn(column, event) {
    const order = DOM.getOrderColumn(event);
    Transaction.order(column, order);
    DOM.updateHeaderColumns(order, event.currentTarget);
  },
  getOrderColumn(event) {
    const mappingsSwitchOrder = [
      {
        currentOrder: "no-order",
        nextOrder: "asc-order",
      },
      {
        currentOrder: "asc-order",
        nextOrder: "desc-order",
      },
      {
        currentOrder: "desc-order",
        nextOrder: "no-order",
      },
    ];
    const currentOrder = event.currentTarget
      .querySelector("span")
      .classList.item(0);
    const mappingSwitchOrder = mappingsSwitchOrder.filter(
      (orderMapping) => orderMapping.currentOrder === currentOrder
    )[0];
    return mappingSwitchOrder.nextOrder;
  },

  updateHeaderColumns(order, element) {
    const orderProperties = [
      {
        cssClass: "asc-order",
        innerText: "⇧",
      },
      {
        cssClass: "desc-order",
        innerText: "⇩",
      },
      {
        cssClass: "no-order",
        innerText: "⇳",
      },
    ];

    const orderProperty = orderProperties.filter(
      (property) => property.cssClass === order
    )[0];
    DOM.clearHeaderColumns();
    element.querySelector("span").classList = orderProperty.cssClass;
    element.querySelector("span").innerText = orderProperty.innerText;
  },

  clearHeaderColumns() {
    const spans = document.querySelectorAll("table thead th span");
    spans.forEach((span) => {
      span.innerText = "⇳";
    });
  },
};

const App = {
  init() {
    Transaction.all.forEach(DOM.addTransaction);
    DOM.updateBalance();
    Storage.set(Transaction.all);
  },
  reload() {
    DOM.clearTransactions();
    DOM.clearHeaderColumns();
    App.init();
  },
};

App.init();
