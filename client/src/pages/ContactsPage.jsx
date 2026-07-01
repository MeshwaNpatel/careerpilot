import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Users } from 'lucide-react';
import { contactsApi } from '../api/contactsApi.js';
import Button from '../components/common/Button.jsx';
import Input from '../components/common/Input.jsx';
import Modal from '../components/common/Modal.jsx';

const contactSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(255),
  roleTitle: z.string().trim().max(255).optional().or(z.literal('')),
  email: z.string().trim().email('Invalid email').max(255).optional().or(z.literal('')),
  linkedinUrl: z.string().trim().max(500).optional().or(z.literal('')),
  phone: z.string().trim().max(50).optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

function EditContactModal({ contact, onClose }) {
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: contact.name ?? '',
      roleTitle: contact.roleTitle ?? '',
      email: contact.email ?? '',
      linkedinUrl: contact.linkedinUrl ?? '',
      phone: contact.phone ?? '',
      notes: contact.notes ?? '',
    },
  });

  const mutation = useMutation({
    mutationFn: (raw) => {
      const payload = { name: raw.name };
      if (raw.roleTitle) payload.roleTitle = raw.roleTitle;
      if (raw.email) payload.email = raw.email;
      if (raw.linkedinUrl) payload.linkedinUrl = raw.linkedinUrl;
      if (raw.phone) payload.phone = raw.phone;
      if (raw.notes) payload.notes = raw.notes;
      return contactsApi.update(contact.applicationId, contact.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      onClose();
      toast.success('Contact updated');
    },
    onError: () => toast.error('Failed to update contact'),
  });

  return (
    <Modal title="Edit Contact" onClose={onClose}>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Name *" error={errors.name?.message} {...register('name')} />
          <Input label="Role / Title" {...register('roleTitle')} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
          <Input label="Phone" {...register('phone')} />
        </div>
        <Input label="LinkedIn URL" placeholder="https://linkedin.com/in/..." {...register('linkedinUrl')} />
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">Notes</span>
          <textarea
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
            rows={2}
            {...register('notes')}
          />
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={mutation.isPending}>Save Changes</Button>
        </div>
        {mutation.isError && (
          <p className="text-center text-sm text-red-600">
            {mutation.error?.response?.data?.error ?? 'Something went wrong'}
          </p>
        )}
      </form>
    </Modal>
  );
}

export default function ContactsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [editingContact, setEditingContact] = useState(null);

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: contactsApi.listAll,
  });

  const deleteMutation = useMutation({
    mutationFn: (c) => contactsApi.remove(c.applicationId, c.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contact deleted');
    },
    onError: () => toast.error('Failed to delete contact'),
  });

  const filtered = contacts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.roleTitle ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (c.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (c.application?.company ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Contacts</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {contacts.length} contact{contacts.length !== 1 ? 's' : ''} across all applications
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-5">
        <input
          type="text"
          placeholder="Search by name, role, email, or company…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
              <div className="h-4 w-1/3 animate-pulse rounded bg-slate-200" />
              <div className="mt-2 h-3 w-1/4 animate-pulse rounded bg-slate-100" />
              <div className="mt-3 h-3 w-1/2 animate-pulse rounded bg-slate-100" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
            <Users className="h-8 w-8 text-indigo-400" />
          </div>
          {search ? (
            <>
              <h3 className="text-lg font-semibold text-slate-800">No results found</h3>
              <p className="mt-1 text-sm text-slate-500">Try a different name, role, email, or company.</p>
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-slate-800">No contacts yet</h3>
              <p className="mt-1 max-w-xs text-sm text-slate-500">
                Add contacts from any application's detail page to build your network here.
              </p>
              <Link
                to="/applications"
                className="mt-5 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
              >
                Go to Applications
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{c.name}</span>
                    {c.roleTitle && (
                      <span className="text-sm text-slate-500 dark:text-slate-400">{c.roleTitle}</span>
                    )}
                  </div>

                  <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
                    {c.email && (
                      <a href={`mailto:${c.email}`} className="text-indigo-600 hover:underline">
                        {c.email}
                      </a>
                    )}
                    {c.phone && <span>{c.phone}</span>}
                    {c.linkedinUrl && (
                      <a
                        href={c.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:underline"
                      >
                        LinkedIn ↗
                      </a>
                    )}
                  </div>

                  {c.notes && (
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{c.notes}</p>
                  )}

                  {c.application && (
                    <Link
                      to={`/applications/${c.application.id}`}
                      className="mt-2 inline-flex items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
                    >
                      {c.application.company} — {c.application.roleTitle}
                    </Link>
                  )}
                </div>

                <div className="flex shrink-0 flex-col gap-1">
                  <button
                    onClick={() => setEditingContact(c)}
                    className="rounded px-2 py-1 text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete ${c.name}?`)) deleteMutation.mutate(c);
                    }}
                    className="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingContact && (
        <EditContactModal
          contact={editingContact}
          onClose={() => setEditingContact(null)}
        />
      )}
    </div>
  );
}
