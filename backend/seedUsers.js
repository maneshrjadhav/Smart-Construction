require("dotenv").config({
    path: require("path").join(__dirname, ".env")
});

const bcrypt = require("bcryptjs");
const db = require("./database");

async function createUsers() {

    try {

        const adminPassword = await bcrypt.hash(
            "admin123",
            10
        );

        const engineerPassword = await bcrypt.hash(
            "engineer123",
            10
        );


        /* ADMIN */

        await db.query(
            `
            INSERT INTO users
            (name, email, password, role, status)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                name = VALUES(name),
                password = VALUES(password),
                role = VALUES(role),
                status = VALUES(status)
            `,
            [
                "Administrator",
                "admin@smartbuild.com",
                adminPassword,
                "Administrator",
                "Active"
            ]
        );


        /* ENGINEER */

        await db.query(
            `
            INSERT INTO users
            (name, email, password, role, status)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                name = VALUES(name),
                password = VALUES(password),
                role = VALUES(role),
                status = VALUES(status)
            `,
            [
                "Engineer",
                "engineer@smartbuild.com",
                engineerPassword,
                "Engineer",
                "Active"
            ]
        );


        console.log("");
        console.log("=================================");
        console.log("Users Created Successfully");
        console.log("=================================");
        console.log("");
        console.log("Administrator");
        console.log("Email: admin@smartbuild.com");
        console.log("Password: admin123");
        console.log("");
        console.log("Engineer");
        console.log("Email: engineer@smartbuild.com");
        console.log("Password: engineer123");
        console.log("");
        console.log("Passwords are stored as bcrypt hashes.");
        console.log("=================================");


    } catch (error) {

        console.error(
            "User creation failed:",
            error.message
        );

    } finally {

        await db.end();

    }

}


createUsers();