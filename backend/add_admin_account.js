const { sql } = require("./db/client");
const bcrypt = require("bcrypt");

async function addAdmin() {
  try {
    const email = "ardi.rs@gmail.com";
    const password = "password123"; // default password

    console.log(`Checking if admin ${email} already exists...`);
    const existing = await sql`SELECT id FROM admin_users WHERE username = ${email}`;

    if (existing.length > 0) {
      console.log(`Admin ${email} already exists.`);
      return;
    }

    console.log("Hashing password...");
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    console.log("Inserting into database...");
    await sql`
      INSERT INTO admin_users (username, password_hash)
      VALUES (${email}, ${passwordHash})
    `;

    console.log(`Successfully added admin: ${email}`);
    console.log(`Default password is: ${password}`);
    console.log(`Please login to the admin panel and change your password.`);
  } catch (error) {
    console.error("Error adding admin:", error);
  }
}

addAdmin();
