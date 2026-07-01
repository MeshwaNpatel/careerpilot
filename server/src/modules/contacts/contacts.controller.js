import * as contactsService from './contacts.service.js';
import { logActivity } from '../../utils/activityLogger.js';

export async function list(req, res, next) {
  try {
    const contacts = await contactsService.listContacts(req.user.userId, req.params.applicationId);
    res.json(contacts);
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const contact = await contactsService.createContact(
      req.user.userId,
      req.params.applicationId,
      req.body
    );
    if (req.params.applicationId) {
      logActivity(req.params.applicationId, req.user.userId, 'contact_added', { name: contact.name, roleTitle: contact.roleTitle });
    }
    res.status(201).json(contact);
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const contact = await contactsService.updateContact(
      req.user.userId,
      req.params.applicationId,
      req.params.id,
      req.body
    );
    res.json(contact);
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    await contactsService.deleteContact(
      req.user.userId,
      req.params.applicationId,
      req.params.id
    );
    if (req.params.applicationId) {
      logActivity(req.params.applicationId, req.user.userId, 'contact_deleted');
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
