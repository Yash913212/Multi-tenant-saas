# Contributing Guide

## Welcome

Thank you for considering contributing to the Multi-Tenant SaaS Platform! This guide will help you get started.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

### Prerequisites

- Node.js 20+
- Docker Desktop
- Git
- PostgreSQL knowledge
- React experience

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/multi-tenant-sass-platform.git
   cd multi-tenant-sass-platform
   ```

2. **Install dependencies**
   ```bash
   # Backend
   cd backend
   npm install

   # Frontend
   cd ../frontend
   npm install
   ```

3. **Set up environment**
   ```bash
   # Copy .env.example to .env
   cp .env.example .env
   
   # Update with your local settings
   nano .env
   ```

4. **Start development environment**
   ```bash
   docker-compose up -d database
   cd backend && npm run dev
   cd frontend && npm run dev
   ```

## Development Workflow

### Branching Strategy

- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/feature-name`: New features
- `fix/bug-description`: Bug fixes
- `docs/doc-name`: Documentation updates

### Creating a Branch

```bash
git checkout develop
git pull origin develop
git checkout -b feature/my-feature
```

### Making Changes

1. Write code following style guidelines
2. Add tests for new functionality
3. Update documentation
4. Test locally
5. Commit with meaningful messages

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(tasks): add drag-and-drop task reordering

Implemented drag-and-drop functionality for tasks using react-beautiful-dnd.
Users can now reorder tasks within a column by dragging.

Closes #123
```

```
fix(auth): correct JWT expiration validation

Fixed bug where expired JWTs were still accepted due to incorrect
time comparison in middleware.

Fixes #456
```

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# E2E tests
npm run test:e2e
```

### Code Style

#### Backend (Node.js)

- Use ES6+ features
- Async/await over callbacks
- Descriptive variable names
- JSDoc comments for functions
- 2-space indentation

```javascript
/**
 * Create a new task
 * @param {string} tenantId - Tenant UUID
 * @param {string} projectId - Project UUID
 * @param {Object} payload - Task data
 * @returns {Promise<Object>} Created task
 */
export async function createTask(tenantId, projectId, payload) {
  // Implementation
}
```

#### Frontend (React)

- Functional components with hooks
- PropTypes for type checking
- Destructure props
- Use semantic HTML
- Descriptive component names

```jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

function TaskCard({ task, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  
  // Component logic
  
  return (
    <div className="task-card">
      {/* JSX */}
    </div>
  );
}

TaskCard.propTypes = {
  task: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired
  }).isRequired,
  onUpdate: PropTypes.func.isRequired
};
```

### Pull Request Process

1. **Update your branch**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout feature/my-feature
   git rebase develop
   ```

2. **Push your changes**
   ```bash
   git push origin feature/my-feature
   ```

3. **Create Pull Request**
   - Go to GitHub repository
   - Click "New Pull Request"
   - Select `develop` as base branch
   - Select your feature branch
   - Fill in PR template

4. **PR Requirements**
   - [ ] Tests pass
   - [ ] Code follows style guide
   - [ ] Documentation updated
   - [ ] No merge conflicts
   - [ ] At least one approval

### Code Review

- Reviewers will provide feedback
- Address all comments
- Push updates to the same branch
- Request re-review when ready

## Project Structure

```
multi-tenant-sass-platform/
├── backend/
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Express middleware
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Utility functions
│   │   ├── app.js          # Express app setup
│   │   └── server.js       # Server entry point
│   ├── migrations/         # Database migrations
│   ├── seeds/              # Database seeds
│   └── tests/              # Backend tests
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── context/        # React context
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── App.jsx         # Root component
│   │   └── main.jsx        # Entry point
│   └── tests/              # Frontend tests
└── docs/                   # Documentation
```

## Feature Development

### Adding a New Entity

1. **Database Migration**
   ```bash
   cd backend
   npx knex migrate:make create_entity_name
   ```

2. **Service Layer**
   ```javascript
   // backend/src/services/entityService.js
   export async function createEntity(tenantId, data) {
     // Implementation with tenant isolation
   }
   ```

3. **Controller**
   ```javascript
   // backend/src/controllers/entityController.js
   export const createEntityHandler = async (req, res) => {
     // Handle request/response
   };
   ```

4. **Routes**
   ```javascript
   // backend/src/routes/entityRoutes.js
   router.post('/', authenticate, createEntityHandler);
   ```

5. **Frontend Service**
   ```javascript
   // frontend/src/services/entityService.js
   export const createEntity = async (data) => {
     return api.post('/entities', data);
   };
   ```

6. **Frontend Component**
   ```jsx
   // frontend/src/pages/EntityPage.jsx
   function EntityPage() {
     // Component implementation
   }
   ```

### Adding Tests

```javascript
// backend/tests/services/entityService.test.js
describe('EntityService', () => {
  describe('createEntity', () => {
    it('should create entity with tenant isolation', async () => {
      // Test implementation
    });
  });
});
```

## Documentation

### Updating Documentation

- Update relevant `.md` files in `docs/`
- Update API documentation in `docs/api.md`
- Update README.md if adding major features
- Add JSDoc comments to functions

### Documentation Standards

- Use clear, concise language
- Include code examples
- Add diagrams where helpful
- Keep documentation in sync with code

## Reporting Issues

### Bug Reports

Include:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment (OS, Node version, Docker version)
- Screenshots if applicable
- Error logs

### Feature Requests

Include:
- Problem description
- Proposed solution
- Alternative solutions considered
- Impact on existing functionality

## Community

### Getting Help

- GitHub Discussions for questions
- GitHub Issues for bugs
- Email: support@yourcompany.com

### Recognition

Contributors will be recognized in:
- README.md Contributors section
- Release notes
- Annual contributor report

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT License).

## Questions?

Feel free to reach out:
- Open a GitHub Discussion
- Email: dev@yourcompany.com
- Slack: #multi-tenant-saas-dev

Thank you for contributing! 🎉
