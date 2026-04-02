# Git Workflow

## Overview

This document outlines the Git workflow for the HR Management System project.

## Branch Strategy

### Main Branches

- `main` - Production-ready code
- `dev` - Development branch (default)

### Feature Branches

Create feature branches from `dev`:
```
feature/<issue-number>-<short-description>
```

Example: `feature/123-add-user-search`

### Bugfix Branches

Create bugfix branches from `dev`:
```
bugfix/<issue-number>-<short-description>
```

Example: `bugfix/456-fix-login-redirect`

### Release Branches

When ready to release:
```
release/v<version>
```

## Commit Messages

Use conventional commit format:

```
<type>(<scope>): <description>

[optional body]
[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic)
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Build, tooling, dependencies

### Examples

```
feat(users): add user search functionality
fix(auth): resolve token expiration issue
docs(readme): update installation instructions
```

## Workflow Steps

### 1. Starting Work

```bash
# Ensure you're on dev branch
git checkout dev
git pull origin dev

# Create feature branch
git checkout -b feature/123-add-user-search
```

### 2. Making Changes

```bash
# Make changes and stage them
git add .
git commit -m "feat(search): add user search with filters"
```

### 3. Pushing Changes

```bash
# Push branch to remote
git push -u origin feature/123-add-user-search
```

### 4. Creating Pull Request

1. Create PR from feature branch to `dev`
2. Fill in PR template
3. Request review
4. Address feedback

### 5. Merging

- Squash and merge to `dev`
- Delete feature branch
- `main` only updated from release branches

## Pull Request Requirements

- All CI checks must pass
- At least one approval required
- No merge conflicts
- Tests passing

## Code Review Guidelines

- Review for correctness, readability, and performance
- Check for security issues
- Verify tests are included
- Ensure documentation updated if needed

## Tagging Releases

```bash
# Create version tag
git tag -a v1.0.0 -m "Release v1.0.0"

# Push tag
git push origin v1.0.0
```

## Handling Hotfixes

```bash
# Create hotfix branch from main
git checkout -b hotfix/789-fix-critical-bug main

# Fix and commit
git commit -m "fix: resolve critical security issue"

# Merge to main
git checkout main
git merge --no-ff hotfix/789-fix-critical-bug

# Also merge to dev
git checkout dev
git merge --no-ff hotfix/789-fix-critical-bug

# Delete hotfix branch
git branch -d hotfix/789-fix-critical-bug
```
