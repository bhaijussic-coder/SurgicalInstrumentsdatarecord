const mysql = require('mysql2/promise');

(async () => {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '@13Password',
      database: 'instrument_testing'
    });

    // Get table structure first
    const [columns] = await connection.execute('DESCRIBE test_records');
    console.log('=== Table Structure ===');
    columns.forEach(col => {
      console.log(`${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'nullable' : 'not null'})`);
    });

    // Query recent test records
    const [rows] = await connection.execute(
      'SELECT * FROM test_records ORDER BY id DESC LIMIT 3'
    );
    
    console.log('=== Recent Test Records ===');
    rows.forEach((row, i) => {
      console.log(`\n[${i + 1}] Row:`, JSON.stringify(row, null, 2));
    });

    // Get today's statistics
    const [stats] = await connection.execute(`
      SELECT 
        COUNT(*) as total_tests,
        SUM(CASE WHEN result = 'Pass' THEN 1 ELSE 0 END) as passed,
        SUM(CASE WHEN result = 'Fail' THEN 1 ELSE 0 END) as failed,
        COUNT(DISTINCT instrument_id) as unique_instruments
      FROM test_records
      WHERE DATE(tested_at) = CURDATE()
    `);
    
    console.log('\n=== Today\'s Statistics ===');
    console.log(`Total Tests: ${stats[0].total_tests}`);
    console.log(`Passed: ${stats[0].passed}`);
    console.log(`Failed: ${stats[0].failed}`);
    console.log(`Unique Instruments: ${stats[0].unique_instruments}`);

    await connection.end();
    console.log('\n✓ Data verified successfully!');
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
