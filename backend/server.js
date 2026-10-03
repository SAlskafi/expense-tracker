const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();

app.use(cors());

app.use(express.json());

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
});

app.get("/api/expenses", async (req, res) => {

    try {
        const expenses = await pool.query(

            `
                        SELECT

                        id,
                        title,
                        amount::float8 AS amount,
                        category,
                        to_char(date, 'DD-MM-YYYY') AS date

                        FROM expenses

                        ` );

        res.json(expenses.rows);

    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});

////////////////////////////////////////////////////////////

app.get("/api/expenses/:id", async (req, res) => {

    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
        return res.status(400).json({ message: "Invalid expense ID" });
    }

    try {
        const result = await pool.query(
            `
                    SELECT
    
                    id,
                    title,
                    amount::float8 AS amount,
                    category,
                    to_char(date, 'DD-MM-YYYY') AS date

                    FROM expenses
                    WHERE id=$1 

                    `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "expense not found" });
        }

        res.json(result.rows[0]);

    } catch (error) {

        res.status(500).json({ message: "Internal server error" });
    }
});

/////////////////////////////////////////////////////////////////

app.post("/api/expenses", async (req, res) => {

    const { title, amount, category, date } = req.body;

    const validCategories = [
        "Food",
        "Transport",
        "Bills",
        "Entertainment",
        "Other",
    ];

    if (
        typeof title !== "string" ||
        title.trim() === "" ||
        typeof amount !== "number" ||
        amount <= 0 ||
        !validCategories.includes(category) ||
        !date
    ) {
        return res.status(400).json({ message: "Invalid expense data" });
    }

    const query = `INSERT INTO expenses (title, amount, category, date) 
                    VALUES  ($1, $2,$3,$4) 
                    RETURNING 
                    id,
                    title,
                    amount::float8 AS amount,
                    category,
                    to_char(date, 'DD-MM-YYYY') AS date`;

    try {
        const result = await pool.query(query, [title.trim(), amount, category, date]);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});

/////////////////////////////////////////////////////////////////////

app.put("/api/expenses/:id", async (req, res) => {

    const id = Number(req.params.id);

    if (Number.isNaN(id)) {

        return res.status(400).json({ message: "Invalid ID" });
    }

    const { title, amount, category, date } = req.body;

    const validCategories = [
        "Food",
        "Transport",
        "Bills",
        "Entertainment",
        "Other",
    ];

    if (
        typeof title !== "string" ||
        title.trim() === "" ||
        typeof amount !== "number" ||
        amount <= 0 ||
        !validCategories.includes(category) ||
        !date
    ) {
        return res.status(400).json({ message: "Invalid expense data" });
    }

    const query = `UPDATE expenses
            SET
                title= $1,
                amount = $2,
                category= $3,
                date = $4
            WHERE id =$5
            RETURNING
                id,
                title,
                amount::float8 AS amount,
                category,
                to_char(date, 'DD-MM-YYYY') AS date `;

    try {
        const result = await pool.query(query, [title.trim(), amount, category, date, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "expense not found" });
        }

        res.status(200).json(result.rows[0]);

    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});

////////////////////////////////////////////////////////////////////////

app.delete("/api/expenses/:id", async (req, res) => {

    const id = Number(req.params.id);

    if (Number.isNaN(id)) {

        return res.status(400).json({ message: "Invalid ID" });
    }

    try {
        const result = await pool.query(

            `
            DELETE FROM expenses
            WHERE id = $1
            RETURNING
                id,
                title,
                amount::float8 AS amount,
                category,
                to_char(date, 'DD-MM-YYYY') AS date

        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "expense not found" });
        }

        res.status(200).json(result.rows[0]);

    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
