import { PrismaClient, Role, GenderType, PropertyType, BookingStatus, TicketStatus, TicketCategory, TicketPriority, PaymentStatus, KycStatus } from '@prisma/client';
import "dotenv/config";

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with mock data...');

  // 1. Create Users (Owners, Tenants, Admin)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@colife.com' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@colife.com',
      phone: '9999999999',
      role: Role.ADMIN,
      kycStatus: KycStatus.VERIFIED,
    },
  });

  const owner1 = await prisma.user.upsert({
    where: { email: 'owner1@colife.com' },
    update: {},
    create: {
      name: 'Priya Sharma',
      email: 'owner1@colife.com',
      phone: '9876543210',
      role: Role.OWNER,
      kycStatus: KycStatus.VERIFIED,
    },
  });

  const tenant1 = await prisma.user.upsert({
    where: { email: 'tenant1@colife.com' },
    update: {},
    create: {
      name: 'Rahul Kumar',
      email: 'tenant1@colife.com',
      phone: '9123456789',
      role: Role.TENANT,
      gender: 'MALE',
      kycStatus: KycStatus.VERIFIED,
    },
  });

  // 2. Create Properties
  const propertiesData = [
    {
      name: 'CoLife Greenwood Heights',
      location: 'Koramangala, Bangalore',
      city: 'Bangalore',
      address: '42, 5th Block, Koramangala, Bangalore - 560095',
      price: 8500,
      originalPrice: 10000,
      type: PropertyType.COLIVING,
      gender: GenderType.UNISEX,
      rating: 4.6,
      reviewCount: 234,
      amenities: ['Wi-Fi', 'AC', 'Laundry', 'Gym', 'Meals', 'Power Backup', 'Parking', 'CCTV'],
      images: ['/rooms/room1.jpg'],
      description: 'Experience premium co-living in the heart of Koramangala.',
      highlights: ['5 min from Forum Mall', 'Near Jyoti Nivas College Metro'],
      availableFrom: new Date('2026-03-01T00:00:00.000Z'),
      deposit: 17000,
      lockIn: '3 months',
      isApproved: true,
      ownerId: owner1.id,
    },
    {
      name: 'CoLife Skyline Residency',
      location: 'HSR Layout, Bangalore',
      city: 'Bangalore',
      address: '23, Sector 3, HSR Layout, Bangalore - 560102',
      price: 9500,
      type: PropertyType.COLIVING,
      gender: GenderType.FEMALE,
      rating: 4.8,
      reviewCount: 312,
      amenities: ['Wi-Fi', 'AC', 'Laundry', 'Gym', 'Meals', 'Yoga Studio'],
      images: ['/rooms/room3.jpg'],
      description: 'An exclusive women-only co-living space designed for comfort and safety.',
      highlights: ['Women-only with premium security'],
      availableFrom: new Date('2026-02-25T00:00:00.000Z'),
      deposit: 19000,
      lockIn: '6 months',
      isApproved: true,
      ownerId: owner1.id,
    }
  ];

  let propRecords = [];
  for (const p of propertiesData) {
    const createdProp = await prisma.property.create({ data: p });
    propRecords.push(createdProp);

    // Create Rooms and Beds for each property
    const room = await prisma.room.create({
      data: {
        name: 'Room 204-A',
        type: p.gender === 'FEMALE' ? 'Single Room' : 'Double Sharing',
        capacity: p.gender === 'FEMALE' ? 1 : 2,
        price: p.price,
        propertyId: createdProp.id,
      }
    });

    await prisma.bed.create({
      data: {
        name: 'Bed 1',
        isOccupied: false,
        roomId: room.id,
      }
    });

    if (room.capacity > 1) {
      await prisma.bed.create({
        data: {
          name: 'Bed 2',
          isOccupied: false,
          roomId: room.id,
        }
      });
    }
  }

  // 3. Create a Booking for Tenant1
  const firstRoom = await prisma.room.findFirst({ where: { propertyId: propRecords[0].id } });
  const firstBed = await prisma.bed.findFirst({ where: { roomId: firstRoom!.id } });

  const booking = await prisma.booking.create({
    data: {
      tenantId: tenant1.id,
      roomId: firstRoom!.id,
      bedId: firstBed!.id,
      status: BookingStatus.CONFIRMED,
      startDate: new Date('2025-09-15T00:00:00.000Z'),
      endDate: new Date('2026-09-14T00:00:00.000Z'),
      amount: firstRoom!.price,
    }
  });

  // Mark bed as occupied
  await prisma.bed.update({
    where: { id: firstBed!.id },
    data: { isOccupied: true }
  });

  // 4. Create a Ticket
  await prisma.ticket.create({
    data: {
      title: 'AC not cooling',
      description: 'The AC in my room is blowing warm air.',
      category: TicketCategory.ELECTRICAL,
      priority: TicketPriority.HIGH,
      status: TicketStatus.OPEN,
      tenantId: tenant1.id,
      propertyId: propRecords[0].id,
    }
  });

  // 5. Create a Payment
  await prisma.payment.create({
    data: {
      amount: booking.amount,
      status: PaymentStatus.CAPTURED,
      tenantId: tenant1.id,
      bookingId: booking.id,
    }
  })

  // 6. Create a Notification
  await prisma.notification.create({
    data: {
      title: 'Welcome to CoLife',
      message: 'Thank you for booking with us! Your living journey starts here.',
      userId: tenant1.id,
    }
  })

  console.log('Database seeding completed successfully ✅');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
