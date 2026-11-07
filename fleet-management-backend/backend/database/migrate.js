const { DataTypes } = require('sequelize');

// sequelize.sync() creates tables that don't exist yet, but it never changes a
// table that does. This file brings databases created by earlier phases up to
// date, and is safe to run on every start: each step first checks whether it
// is still needed. (We stopped using sync({ alter: true }) because on MySQL it
// quietly adds another duplicate unique index every time the server restarts,
// until MySQL refuses at 64.)
async function addColumnIfMissing(queryInterface, table, column, definition) {
  const existing = await queryInterface.describeTable(table);
  if (!existing[column]) {
    await queryInterface.addColumn(table, column, definition);
    console.log(`Upgraded database: added ${table}.${column}`);
  }
}

async function migrate(sequelize) {
  const queryInterface = sequelize.getQueryInterface();

  await addColumnIfMissing(queryInterface, 'trucks', 'capacity_tonnes', { type: DataTypes.DECIMAL(8, 2), allowNull: true });
  await addColumnIfMissing(queryInterface, 'truck_documents', 'document_number', { type: DataTypes.STRING, allowNull: true });
  await addColumnIfMissing(queryInterface, 'trips', 'notes', { type: DataTypes.STRING, allowNull: true });

  // Logbook became a document type in Phase 8.
  const documents = await queryInterface.describeTable('truck_documents');
  if (!String(documents.document_type.type).includes('LOGBOOK')) {
    await queryInterface.changeColumn('truck_documents', 'document_type', {
      type: DataTypes.ENUM('INSURANCE', 'INSPECTION', 'PERMIT', 'LICENSE', 'LOGBOOK', 'OTHER'),
      allowNull: false,
    });
    console.log('Upgraded database: added LOGBOOK to truck_documents.document_type');
  }
}

module.exports = migrate;
