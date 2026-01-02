export async function up(knex) {
    await knex.schema.createTable('projects', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
        table.string('name').notNullable();
        table.text('description');
        table.enu('status', ['active', 'archived', 'completed']).notNullable().defaultTo('active');
        table.uuid('created_by').notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        table.index(['tenant_id']);
    });
}

export async function down(knex) {
    await knex.schema.dropTableIfExists('projects');
}