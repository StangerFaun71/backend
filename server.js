const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");
const session = require("express-session");
const path = require("path");

const app = express();
const PORT = 3000;

// Middleware – űrlap adat
app.use(express.urlencoded({ extended: false }));

// Session beállítás
app.use(session({
    secret: "nagyon_hosszú_random_titkos_szöveg",
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 // 1 nap
    }
}));

// Adatbázis megnyitása
const db = new sqlite3.Database("./db/users.db", (err) => {
    if (err) return console.log(err.message);
    console.log("DB ok");
});
const items = new sqlite3.Database('./db/items.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) return console.log(err.message);
    console.log("Adatbázis OK");
});

// Tábla létrehozás
db.run(`
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    firstName TEXT,
    lastName TEXT,
    username TEXT UNIQUE,
    birthYear INTEGER,
    emailAddress TEXT UNIQUE,
    phoneNumber TEXT,
    password TEXT
)
`);
item.run()
// ---------- Oldalak ----------
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "login.html"));
});

app.get("/register", (req, res) => {
    res.sendFile(path.join(__dirname, "register.html"));
});

app.get("/profile", (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    res.sendFile(path.join(__dirname, "profile.html"));
});

app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "login.html"));
});

// ---------- Regisztráció ----------
app.post("/register", async (req, res) => {
    const { firstName, lastName, username, birthYear, emailAddress, phoneNumber, password } = req.body;

    const hash = await bcrypt.hash(password, 10);

    const sql = `
        INSERT INTO users (firstName, lastName, username, birthYear, emailAddress, phoneNumber, password)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(sql, [firstName, lastName, username, birthYear, emailAddress, phoneNumber, hash], (err) => {
        if (err) {
            return res.send("Hiba: " + err.message);
        }
        res.send("Sikeres regisztráció! <a href='/login'>Bejelentkezés</a>");
    });
});

// ---------- Login ----------
app.post("/login", (req, res) => {
    const { emailAddress, password } = req.body;

    const sql = "SELECT * FROM users WHERE emailAddress = ?";

    db.get(sql, [emailAddress], async (err, user) => {
        if (!user) return res.send("Nincs ilyen felhasználó!");

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.send("Hibás jelszó!");

        // SESSION létrehozása
        req.session.user = {
            id: user.id,
            username: user.username,
            email: user.emailAddress
        };

        res.redirect("/profile");
    });
});

// ---------- Profil lekérdezése ----------
app.get("/whoami", (req, res) => {
    if (!req.session.user) return res.send("Senki nincs bejelentkezve!");
    res.json(req.session.user);
});

// ---------- Logout ----------
app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.send("Kijelentkeztél! <a href='/login'>Vissza a loginra</a>");
    });
});

// Szerver indítása
app.listen(PORT, () => console.log("Fut: http://localhost:" + PORT));
