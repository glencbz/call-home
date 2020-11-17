const { sanitizeDbErrors } = require('./lib');
const { normalizePhoneNumber } = require('../util/country');

function ContactService(ContactModel, userService) {
  async function listContacts() {
    return ContactModel.findAll({
      order: ['name'],
    });
  }

  async function normalizeContact(user, contact) {
    return {
      ...contact,
      phoneNumber: await normalizePhoneNumber(
        contact.phoneNumber,
        user.destinationCountry
      ),
      UserId: user.id,
    };
  }

  async function validateDuplicateContact(user, contact) {
    const phoneNumber = await normalizePhoneNumber(
      contact.phoneNumber,
      user.destinationCountry
    );

    const duplicateContact = await ContactModel.findOne({
      where: {
        UserId: user.id,
        phoneNumber,
      },
    });

    if (duplicateContact) {
      throw new Error('Validation Error: DUPLICATE_CONTACT');
    }
  }

  async function validateContactFields(contact) {
    if (!contact.name) {
      throw new Error('Validation Error: CONTACT_NAME_BLANK');
    }
  }

  async function listContactsByUserId(UserId) {
    return ContactModel.findAll({
      order: ['name'],
      where: {
        UserId,
      },
    });
  }

  async function listContactsFromIds(ids) {
    return ContactModel.findAll({
      where: {
        id: ids,
      },
    });
  }

  async function createContact(UserId, contact) {
    const user = await userService.getUser(UserId);
    await Promise.all([
      validateDuplicateContact(user, contact),
      validateContactFields(contact),
    ]);
    const contactToCreate = await normalizeContact(user, contact);
    return sanitizeDbErrors(() => ContactModel.create(contactToCreate));
  }

  async function getContact(UserId, contactId) {
    return ContactModel.findOne({
      where: {
        id: contactId,
        UserId,
      },
    });
  }

  async function updateContact(UserId, contactId, contact) {
    const user = await userService.getUser(UserId);
    await validateContactFields(contact);
    const contactToUpdate = await normalizeContact(user, contact);
    await ContactModel.update(contactToUpdate, {
      where: {
        id: contactId,
        UserId,
      },
    });
    return getContact(UserId, contactId);
  }

  async function deleteContact(UserId, contactId) {
    const contact = await getContact(UserId, contactId);
    await contact.destroy();
  }

  return {
    listContacts,
    listContactsByUserId,
    createContact,
    getContact,
    updateContact,
    deleteContact,
    listContactsFromIds,
  };
}

module.exports = ContactService;
