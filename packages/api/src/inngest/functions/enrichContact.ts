import { updateContact } from '@azzapp/data';
import { enrichContact as enrichContactData } from '@azzapp/enrichment';
import { inngest } from '../client';
import type { Contact } from '@azzapp/data';
import type { EnrichResult } from '@azzapp/enrichment';

export const enrichContact = inngest.createFunction(
  {
    id: 'enrichContact',
    cancelOn: [
      {
        event: 'send/enrichContact',
        match: 'data.contact.id',
      },
      {
        event: 'cancel/enrichContact',
        if: 'event.data.contactId == event.data.contactId',
      },
    ],
    onFailure: ({ event }) => {
      const contact = event.data.event.data?.contact;
      if (contact) {
        return updateContact(contact.id, {
          enrichmentStatus: 'failed',
        });
      }
    },
  },
  { event: 'send/enrichContact' },
  async ({ event }) => {
    const contact: Contact = event.data.contact;
    const userId: string = event.data.userId;
    await updateContact(contact.id, {
      enrichmentStatus: 'running',
    });
    let result: EnrichResult;
    try {
      result = await enrichContactData(userId, { contact });
      await updateContact(contact.id, {
        enrichmentStatus: 'completed',
      });
    } catch (e) {
      await updateContact(contact.id, {
        enrichmentStatus: 'failed',
      });
      throw e;
    }

    return result;
  },
);

export const cancelEnrichContact = inngest.createFunction(
  { id: 'cancelEnrichContact' },
  { event: 'cancel/enrichContact' },
  async () => {
    //nothing to do here, just a placeholder for cancellation
  },
);
