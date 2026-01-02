export async function up(knex) {
    await knex.schema.createTable('audit_logs', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.uuid('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
        table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
        table.string('action').notNullable();
        table.string('entity_type');
        table.string('entity_id');
        table.string('ip_address');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.index(['tenant_id']);
    });
}

export async function down(knex) {
    await knex.schema.dropTableIfExists('audit_logs');
}