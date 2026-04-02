/**
 * Seed Script - Creates Super Admin, default roles and permissions
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // 1. Create Permissions
  const modules = ['users', 'roles', 'permissions', 'dashboard'];
  const actions = ['view', 'create', 'edit', 'delete'];

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

  console.log(`✅ Created ${createdPermissions.length} permissions`);

  // 2. Create Super Admin Role
  console.log('👑 Creating Super Admin role...');
  
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'Super Admin' },
    update: {},
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

  console.log('✅ Created Super Admin role');

  // 3. Create Admin Role
  console.log('🏢 Creating Admin role...');
  
  const adminPermissions = createdPermissions.filter(
    p => p.module !== 'permissions' || p.action === 'view'
  );

  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {},
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

  console.log('✅ Created Admin role');

  // 4. Create User Role
  console.log('👤 Creating User role...');
  
  const userPermissions = createdPermissions.filter(
    p => p.module === 'dashboard' || 
    (p.module === 'users' && p.action === 'view')
  );

  const userRole = await prisma.role.upsert({
    where: { name: 'User' },
    update: {},
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

  console.log('✅ Created User role');

  // 5. Create Super Admin User
  console.log('👑 Creating Super Admin user...');
  
  const hashedPassword = await bcrypt.hash('superadmin123', 10);

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

  console.log('✅ Created Super Admin user');
  console.log('');
  console.log('🎉 Seed completed!');
  console.log('');
  console.log('📝 Login credentials:');
  console.log('   Email: superadmin@hrm.com');
  console.log('   Password: superadmin123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
