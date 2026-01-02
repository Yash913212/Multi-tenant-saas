export async function up(knex) {
    await knex.schema.createTable('users', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.uuid('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
        table.string('email').notNullable();
        table.string('password_hash').notNullable();
        table.string('full_name').notNullable();
        table.enu('role', ['super_admin', 'tenant_admin', 'user']).notNullable().defaultTo('user');
        table.boolean('is_active').notNullable().defaultTo(true);
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        table.unique(['tenant_id', 'email']);
        table.index(['tenant_id']);
    });
}

export async function down(knex) {
    await knex.schema.dropTableIfExists('users');
}