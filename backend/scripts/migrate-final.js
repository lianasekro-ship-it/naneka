import pkg from 'pg';
const { Client } = pkg;

async function migrate() {
    // Unganisha na Database ya hapo Codespace
    const localClient = new Client({ 
        connectionString: "postgresql://naneka_user:changeme@localhost:5432/naneka" 
    });

    // Unganisha na Supabase
    const supabaseClient = new Client({ 
        host: 'db.qeuwnzzvzcvfxtwqemri.supabase.co',
        port: 5432,
        database: 'postgres',
        user: 'postgres',
        password: 'Mp0mbeyag0nja',
        ssl: { rejectUnauthorized: false }
    });

    try {
        await localClient.connect();
        await supabaseClient.connect();
        console.log("✅ Zote zimeunganishwa! Naanza kuhamisha data...");

        // Chukua bidhaa zote 30
        const res = await localClient.query('SELECT * FROM products');
        console.log(`📦 Nimepata bidhaa ${res.rows.length}. Nazituma Supabase...`);

        for (const p of res.rows) {
            await supabaseClient.query(
                'INSERT INTO products (name, description, price, category_id, image_url) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING',
                [p.name, p.description, p.price, p.category_id, p.image_url]
            );
        }
        console.log("🚀 Hongera! Data zote 30 sasa zipo Supabase Live!");
    } catch (err) {
        console.error("❌ Hitilafu:", err.message);
    } finally {
        await localClient.end();
        await supabaseClient.end();
    }
}
migrate();
