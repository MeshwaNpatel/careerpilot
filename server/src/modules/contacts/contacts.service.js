import prisma from '../../config/db.js';
import ApiError from '../../utils/ApiError.js';

async function assertApplicationOwnership(userId, applicationId) {
  const app = await prisma.application.findFirst({ where: { id: applicationId, userId } });
  if (!app) throw new ApiError('Application not found', 404);
}

async function assertContactOwnership(userId, applicationId, contactId) {
  const contact = await prisma.contact.findFirst({
    where: { id: contactId, applicationId },
    include: { application: { select: { userId: true } } },
  });
  if (!contact || contact.application.userId !== userId) {
    throw new ApiError('Contact not found', 404);
  }
  return contact;
}

export async function listAllContacts(userId) {
  return prisma.contact.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      application: { select: { id: true, company: true, roleTitle: true } },
    },
  });
}

export async function listContacts(userId, applicationId) {
  await assertApplicationOwnership(userId, applicationId);
  return prisma.contact.findMany({
    where: { applicationId },
    orderBy: { createdAt: 'asc' },
  });
}

export async function createContact(userId, applicationId, data) {
  await assertApplicationOwnership(userId, applicationId);
  const payload = {};
  for (const [k, v] of Object.entries(data)) {
    payload[k] = v || null;
  }
  payload.name = data.name;
  return prisma.contact.create({ data: { ...payload, userId, applicationId } });
}

export async function updateContact(userId, applicationId, contactId, data) {
  await assertContactOwnership(userId, applicationId, contactId);
  const updateData = {};
  for (const [k, v] of Object.entries(data)) {
    updateData[k] = v || null;
  }
  if ('name' in data) updateData.name = data.name;
  return prisma.contact.update({ where: { id: contactId }, data: updateData });
}

export async function deleteContact(userId, applicationId, contactId) {
  await assertContactOwnership(userId, applicationId, contactId);
  await prisma.contact.delete({ where: { id: contactId } });
}
