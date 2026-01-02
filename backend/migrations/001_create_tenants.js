export async function up(knex) {
    await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await knex.schema.createTable('tenants', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.string('name').notNullable();
        table.string('subdomain').notNullable().unique();
        table.enu('status', ['active', 'suspended', 'trial']).notNullable().defaultTo('active');
        table.enu('subscription_plan', ['free', 'pro', 'enterprise']).notNullable().defaultTo('free');
        table.integer('max_users').notNullable().defaultTo(5);
        table.integer('max_projects').notNullable().defaultTo(3);
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
}

export async function down(knex) {
    await knex.schema.dropTableIfExists('tenants');
}