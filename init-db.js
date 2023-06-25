// Import the required MongoDB modules
const conn = new Mongo();
const db = conn.getDB("your_database_name");

// Check if the admin user already exists
const adminUser = db.getUser("polygonescrowadmin");

if (adminUser) {
  print("Admin user already exists.");
  process.exit(0);
}

// Create the admin user
db.createUser({
    user: "polygonescrowadmin",
    pwd: "877429bd3a230391263ed10bee55d1edf6dfe50833debd",
    roles: [
        { role: "readWrite", db: "polygon-escrow-db", collection: "Users" },
        { role: "readWrite", db: "polygon-escrow-db", collection: "Contracts" }
    ]
});
