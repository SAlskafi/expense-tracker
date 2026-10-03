
const API_URL = "http://localhost:3000/api/expenses";


const titleInput = document.getElementById("inputTitle");
const amountInput = document.getElementById("inputAmount");
const categoryInput = document.getElementById("inputCategory");
const dateInput = document.getElementById("inputDate");

//

const filterCategory = document.getElementById("filterCategory");


const tbody = document.getElementById("expensesTableBody");

const tableSpinner = document.getElementById("tableSpinner");
const formSpinner = document.getElementById("formSpinner");
const modalSpinner = document.getElementById("modalSpinner");

const globalAlert = document.getElementById("globalAlert");

const addForm = document.getElementById("expenseForm"); //listener

//

const titleError = document.getElementById("titleError");
const amountError = document.getElementById("amountError");
const categoryError = document.getElementById("categoryError");
const dateError = document.getElementById("dateError");


//

const totalAmountElement = document.getElementById("totalAmount");
const numberOfExpensesElement = document.getElementById("numberOfExpenses");
const highestAmountElement = document.getElementById("highestAmount");
const highestExpenseElement = document.getElementById("highestExpense");

//

const editAlert = document.getElementById("editAlert");
const editTitle = document.getElementById("editTitle");
const editAmount = document.getElementById("editAmount");
const editCategory = document.getElementById("editCategory");
const editDate = document.getElementById("editDate");


//

const editTitleError = document.getElementById("editTitleError");
const editAmountError = document.getElementById("editAmountError");
const editCategoryError = document.getElementById("editCategoryError");
const editDateError = document.getElementById("editDateError");


const saveEditButton = document.getElementById("saveEditButton");


const editModalElement = document.getElementById("editModal");
const editModal = new bootstrap.Modal(editModalElement);


//


let allExpenses = [];

let selectedExpenseId = null;

//


function showAlert(alertElement, message) {

    alertElement.textContent = message;

    alertElement.classList.remove("d-none");

    if (alertElement === globalAlert) {
        alertElement.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }
}

function hideAlert(alertElement) {

    alertElement.textContent = "";

    alertElement.classList.add("d-none");
}


function showSpinner(spinnerElement) {

    spinnerElement.classList.remove("d-none");
}


function hideSpinner(spinnerElement) {

    spinnerElement.classList.add("d-none");
}


function showRequestError(error, alertElement = globalAlert) {

    if (error.name === "TypeError") {

        showAlert(
            alertElement,
            "Unable to connect to the server. Please make sure the server is running."
        );

    } else {

        showAlert(alertElement, error.message);
    }
}

//


async function getExpenses() {

    try {

        const response = await fetch(API_URL);

        const data = await response.json();

        if (!response.ok) {

            throw new Error(data.message);
        }


        return data;

    } catch (error) {

        showRequestError(error);

        return null;
    }
}


async function addExpense(data) {

    try {

        const response = await fetch(API_URL, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(data)
        });


        const responseData = await response.json();


        if (!response.ok) {

            throw new Error(responseData.message);
        }


        return responseData;

    } catch (error) {

        showRequestError(error);

        return null;
    }
}


async function updateExpense(id, data) {

    try {

        const response = await fetch(API_URL + "/" + id, {

            method: "PUT",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(data)
        }
        );


        const responseData = await response.json();


        if (!response.ok) {

            throw new Error(responseData.message);
        }


        return responseData;

    } catch (error) {

        showRequestError(error, editAlert);

        return null;
    }
}


async function deleteExpense(id) {

    try {

        const response = await fetch(API_URL + "/" + id, {
            method: "DELETE"
        }
        );


        const responseData = await response.json();


        if (!response.ok) {

            throw new Error(responseData.message);
        }


        return responseData;

    } catch (error) {

        showRequestError(error);

        return null;
    }
}


//


function renderTable(list) {

    tbody.innerHTML = "";

    list.forEach(function (expense) {


        const tr = document.createElement("tr");


        const tdTitle = document.createElement("td");
        tdTitle.textContent = expense.title;

        const tdAmount = document.createElement("td");
        tdAmount.textContent = expense.amount;

        const tdCategory = document.createElement("td");
        const categoryBadge = document.createElement("span");

        tdCategory.appendChild(categoryBadge);

        categoryBadge.textContent = expense.category;

        const categoryColor = getCategoryColor(expense.category);


        categoryBadge.classList.add("badge", categoryColor);


        const tdDate = document.createElement("td");
        tdDate.textContent = expense.date;


        const tdActions = document.createElement("td");

        const editButton = document.createElement("button");
        editButton.textContent = "Edit";
        editButton.classList.add("btn", "btn-outline-secondary", "btn-sm", "me-2");


        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.classList.add("btn", "btn-outline-danger", "btn-sm");

        tdActions.appendChild(editButton);
        tdActions.appendChild(deleteButton);



        tr.appendChild(tdTitle);
        tr.appendChild(tdAmount);
        tr.appendChild(tdCategory);
        tr.appendChild(tdDate);
        tr.appendChild(tdActions);

        tbody.appendChild(tr);


        editButton.addEventListener("click", function () {

            openEditModal(expense);
        }
        );


        deleteButton.addEventListener("click", async function () {

            const confirmed = confirm("Are you sure you want to delete this expense?");

            if (!confirmed) {

                return;
            }


            hideAlert(globalAlert);

            showSpinner(tableSpinner);

            const result = await deleteExpense(expense.id);


            hideSpinner(tableSpinner);

            if (!result) {

                return;
            }

            await refresh();
        }
        );
    });
}



function renderSummary(list) {

    let totalAmount = 0;

    let highestExpense = list[0] || null;

    list.forEach(function (expense) {

        totalAmount += expense.amount;

        if (highestExpense && expense.amount > highestExpense.amount) {

            highestExpense = expense;
        }
    });


    totalAmountElement.textContent = totalAmount;
    numberOfExpensesElement.textContent = list.length;

    if (!highestExpense) {

        highestAmountElement.textContent = "0";

        highestExpenseElement.textContent = "No expenses";

        return;
    }

    highestAmountElement.textContent = highestExpense.amount;
    highestExpenseElement.textContent = highestExpense.title;
}


function applyFilter(list) {


    const selectedCategory = filterCategory.value;


    if (selectedCategory === "") {

        renderTable(list);

        return;
    }

    const filteredList = list.filter(function (expense) {

        return expense.category === selectedCategory;
    });

    renderTable(filteredList);
}


async function refresh() {


    hideAlert(globalAlert);

    showSpinner(tableSpinner);

    const expenses = await getExpenses();

    hideSpinner(tableSpinner);


    if (!expenses) {

        return;
    }

    allExpenses = expenses;

    renderSummary(allExpenses);

    applyFilter(allExpenses);
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function clearErrors(errorElementsObject) {

    Object.values(errorElementsObject).forEach(element => element.textContent = "");
}



function validateForm(values, errors) {

    let isValid = true;


    if (values.title === "") {
        errors.title.textContent = "Title is required.";
        isValid = false;
    }


    if (values.rawAmount === "") {
        errors.amount.textContent = "Amount is required.";
        isValid = false;


    } else if (values.amount <= 0) {
        errors.amount.textContent = "Amount must be greater than zero.";
        isValid = false;
    }


    if (!values.category) {
        errors.category.textContent = "Please select a category.";
        isValid = false;
    }


    if (!values.date) {
        errors.date.textContent = "Date is required.";
        isValid = false;
    }

    return isValid;
}

//

addForm.addEventListener("submit", async function (eventObject) {

    const values = {
        title: titleInput.value.trim(),
        amount: Number(amountInput.value),
        rawAmount: amountInput.value,
        category: categoryInput.value,
        date: dateInput.value
    };


    const errorElements = {
        title: titleError,
        amount: amountError,
        category: categoryError,
        date: dateError
    };


    eventObject.preventDefault();
    hideAlert(globalAlert);
    clearErrors(errorElements);


    if (!validateForm(values, errorElements)) {

        return;
    }


    const data = {

        title: values.title,

        amount: values.amount,

        category: values.category,

        date: values.date
    };


    showSpinner(formSpinner);


    const result = await addExpense(data);


    hideSpinner(formSpinner);


    if (!result) {

        return;
    }


    addForm.reset();

    await refresh();
}
);


filterCategory.addEventListener("change", function () {

    applyFilter(allExpenses);
}
);

// Convert DD-MM-YYYY from the API to YYYY-MM-DD required by input[type="date"].
function convertDateForInput(date) {

    const parts = date.split("-");


    const day = parts[0];
    const month = parts[1];
    const year = parts[2];

    return year + "-" + month + "-" + day;
}


function openEditModal(expense) {


    selectedExpenseId = expense.id;

    hideAlert(editAlert);

    editTitle.value = expense.title;
    editAmount.value = expense.amount;
    editCategory.value = expense.category;

    editDate.value = convertDateForInput(expense.date);

    editModal.show();
}


saveEditButton.addEventListener("click", async function () {

    const values = {
        title: editTitle.value.trim(),
        amount: Number(editAmount.value),
        rawAmount: editAmount.value,
        category: editCategory.value,
        date: editDate.value
    };


    const errorElements = {
        title: editTitleError,
        amount: editAmountError,
        category: editCategoryError,
        date: editDateError
    };


    hideAlert(editAlert);
    clearErrors(errorElements);

    if (!validateForm(values, errorElements)) {

        return;
    }



    const data = {

        title: values.title,

        amount: values.amount,

        category: values.category,

        date: values.date
    };


    showSpinner(modalSpinner);

    const result = await updateExpense(selectedExpenseId, data);

    hideSpinner(modalSpinner);

    if (!result) {

        return;

    }


    editModal.hide();

    await refresh();
}
);

function getCategoryColor(category) {


    const colors = {
        "Food": "bg-success",
        "Transport": "bg-primary",
        "Bills": "bg-warning",
        "Entertainment": "bg-danger",
        "Other": "bg-secondary"
    };

    return colors[category] || "bg-secondary";
}



refresh();

