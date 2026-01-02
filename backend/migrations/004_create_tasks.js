export async function up(knex) {
    await knex.schema.createTable('tasks', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.uuid('project_id').notNullable().references('id').inTable('projects').onDelete('CASCADE');
        table.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
        table.string('title').notNullable();
        table.text('description');
        table.enu('status', ['todo', 'in_progress', 'completed']).notNullable().defaultTo('todo');
        table.enu('priority', ['low', 'medium', 'high']).notNullable().defaultTo('medium');
        table.uuid('assigned_to').nullable().references('id').inTable('users').onDelete('SET NULL');
        table.date('due_date');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        table.index(['tenant_id', 'project_id']);
    });
}

export async function down(knex) {
    await knex.schema.dropTableIfExists('tasks');
}