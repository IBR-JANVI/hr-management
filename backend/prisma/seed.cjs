/**
 * @module Seed script - creates super admin, default roles and permissions
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const BCRYPT_SALT_ROUNDS = 10;

const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD;
if (!SUPERADMIN_PASSWORD) {
  console.error('❌ SUPERADMIN_PASSWORD environment variable is required');
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  // eslint-disable-next-line no-console -- Seed script runs standalone before logger initialization
  console.log('🌱 Starting seed...');

  // 1. Create Permissions
  const modules = ['users', 'roles', 'permissions', 'dashboard'];
  const actions = ['view', 'create', 'edit', 'delete'];

  // eslint-disable-next-line no-console -- Seed script runs standalone before logger initialization
  console.log('📦 Creating permissions...');
  
  const createdPermissions = [];
  for (const module of modules) {
    for (const action of actions) {
      const permission = await prisma.permission.upsert({
        where: { module_action: { module, action } },
        update: {},
        create: { module, action }
      });
      createdPermissions.push(permission);
    }
  }

  // eslint-disable-next-line no-console -- Seed script runs standalone before logger initialization
  console.log(`✅ Created ${createdPermissions.length} permissions`);

  // 2. Create Super Admin Role
  // eslint-disable-next-line no-console -- Seed script runs standalone before logger initialization
  console.log('👑 Creating Super Admin role...');
  
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'Super Admin' },
    update: { description: 'Full system access - cannot be modified' },
    create: {
      name: 'Super Admin',
      description: 'Full system access - cannot be modified',
      isSuperAdmin: true,
      isDefault: false,
      permissions: {
        create: createdPermissions.map(p => ({ permissionId: p.id }))
      }
    }
  });
  
  // Delete existing permissions to ensure sync on re-run
  await prisma.rolePermission.deleteMany({
    where: { roleId: superAdminRole.id }
  });
  
  // Recreate permissions
  await prisma.rolePermission.createMany({
    data: createdPermissions.map(p => ({ roleId: superAdminRole.id, permissionId: p.id }))
  });

  // eslint-disable-next-line no-console -- Seed script runs standalone before logger initialization
  console.log('✅ Created Super Admin role');

  // 3. Create Admin Role
  // eslint-disable-next-line no-console -- Seed script runs standalone before logger initialization
  console.log('🏢 Creating Admin role...');
  
  const adminPermissions = createdPermissions.filter(
    p => p.module !== 'permissions' || p.action === 'view'
  );

  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: { description: 'Administrator with management access' },
    create: {
      name: 'Admin',
      description: 'Administrator with management access',
      isSuperAdmin: false,
      isDefault: false,
      permissions: {
        create: adminPermissions.map(p => ({ permissionId: p.id }))
      }
    }
  });
  
  // Delete existing permissions to ensure sync on re-run
  await prisma.rolePermission.deleteMany({
    where: { roleId: adminRole.id }
  });
  
  // Recreate permissions
  await prisma.rolePermission.createMany({
    data: adminPermissions.map(p => ({ roleId: adminRole.id, permissionId: p.id }))
  });

  // eslint-disable-next-line no-console -- Seed script runs standalone before logger initialization
  console.log('✅ Created Admin role');

  // 4. Create User Role
  // eslint-disable-next-line no-console -- Seed script runs standalone before logger initialization
  console.log('👤 Creating User role...');
  
  const userPermissions = createdPermissions.filter(
    p => p.module === 'dashboard' || 
    (p.module === 'users' && p.action === 'view')
  );

  const userRole = await prisma.role.upsert({
    where: { name: 'User' },
    update: { description: 'Regular user with basic access' },
    create: {
      name: 'User',
      description: 'Regular user with basic access',
      isSuperAdmin: false,
      isDefault: true,
      permissions: {
        create: userPermissions.map(p => ({ permissionId: p.id }))
      }
    }
  });
  
  // Delete existing permissions to ensure sync on re-run
  await prisma.rolePermission.deleteMany({
    where: { roleId: userRole.id }
  });
  
  // Recreate permissions
  await prisma.rolePermission.createMany({
    data: userPermissions.map(p => ({ roleId: userRole.id, permissionId: p.id }))
  });

  // eslint-disable-next-line no-console -- Seed script runs standalone before logger initialization
  console.log('✅ Created User role');

  // 5. Create Super Admin User
  // eslint-disable-next-line no-console -- Seed script runs standalone before logger initialization
  console.log('👑 Creating Super Admin user...');
  
  const hashedPassword = await bcrypt.hash(SUPERADMIN_PASSWORD, BCRYPT_SALT_ROUNDS);

  const superAdminUser = await prisma.user.upsert({
    where: { email: 'superadmin@hrm.com' },
    update: {},
    create: {
      email: 'superadmin@hrm.com',
      name: 'Super Admin',
      password: hashedPassword,
      status: 'ACTIVE',
      roles: {
        create: { roleId: superAdminRole.id }
      }
    }
  });

  // eslint-disable-next-line no-console -- Seed script runs standalone before logger initialization
  console.log('✅ Created Super Admin user');
  // eslint-disable-next-line no-console -- Seed script runs standalone before logger initialization
  console.log('');
  // eslint-disable-next-line no-console -- Seed script runs standalone before logger initialization
  console.log('🎉 Seed completed!');
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console -- Seed script runs standalone before logger initialization
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
