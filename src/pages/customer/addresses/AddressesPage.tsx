import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { addressesApi } from '@/api/addresses'
import type { CreateAddressData } from '@/api/addresses'
import Loading from '@/components/common/Loading'
import Alert from '@/components/common/Alert'
import Card from '@/components/common/Card'
import Button from '@/components/common/Button'
import Modal from '@/components/common/Modal'
import FormInput from '@/components/common/FormInput'
import ConfirmationModal from '@/components/common/ConfirmationModal'
import { apiMessage } from '@/utils/axiosError'
import { validateRequired } from '@/utils/validation'
import { useForm } from '@/hooks/useForm'
import type { Address } from '@/types'
import { usePageTitle } from '@/hooks/usePageTitle'

const emptyAddress = {
  full_name: '',
  phone: '',
  province: '',
  district_khan: '',
  commune_sangkat: '',
  street_house: '',
  is_default: 'false',
}

const AddressesPage: React.FC = () => {
  usePageTitle('My Addresses')
  const navigate = useNavigate()
  const location = useLocation()
  const returnTo = (location.state as { from?: string } | null)?.from
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    addressesApi
      .list()
      .then((res) => setAddresses(res.data.data))
      .catch((err) => setError(apiMessage(err, 'Failed to load addresses')))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const openCreate = () => {
    setEditingId(null)
    reset()
    setModalOpen(true)
  }

  const openEdit = (address: Address) => {
    setEditingId(address.id)
    setValue('full_name', address.full_name)
    setValue('phone', address.phone)
    setValue('province', address.province)
    setValue('district_khan', address.district_khan)
    setValue('commune_sangkat', address.commune_sangkat)
    setValue('street_house', address.street_house)
    setValue('is_default', address.is_default ? 'true' : 'false')
    setModalOpen(true)
  }

  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setValue,
  } = useForm<Record<string, unknown>>({
    initialValues: emptyAddress as unknown as Record<string, unknown>,
    validate: (v) => {
      const errs: Record<string, string> = {}
      const fields = [
        'full_name',
        'phone',
        'province',
        'district_khan',
        'commune_sangkat',
        'street_house',
      ] as const
      for (const f of fields) {
        const r = validateRequired(String(v[f] ?? ''))
        if (!r.valid) errs[f] = r.message!
      }
      return errs
    },
    onSubmit: async (v) => {
      const data: CreateAddressData = {
        full_name: String(v.full_name),
        phone: String(v.phone),
        province: String(v.province),
        district_khan: String(v.district_khan),
        commune_sangkat: String(v.commune_sangkat),
        street_house: String(v.street_house),
        is_default: v.is_default === 'true',
      }
      if (editingId) {
        await addressesApi.update(editingId, data)
        setModalOpen(false)
        setSuccessMessage('Address updated successfully.')
        load()
      } else {
        await addressesApi.create(data)
        setModalOpen(false)
        if (returnTo) {
          navigate(returnTo)
        } else {
          setSuccessMessage('Address added successfully.')
          load()
        }
      }
    },
  })

  const handleDelete = async () => {
    if (!deletingId) return
    setIsDeleting(true)
    try {
      await addressesApi.delete(deletingId)
      setDeletingId(null)
      load()
    } catch (err) {
      setActionError(apiMessage(err, 'Failed to delete address'))
    } finally {
      setIsDeleting(false)
    }
  }

  if (loading) return <Loading className="py-20" />

  const newValues = values as unknown as typeof emptyAddress

  return (
    <div className="overflow-y-auto">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Addresses</h1>
        <Button onClick={openCreate}>Add Address</Button>
      </div>

      {error && <Alert type="error" message={error} />}
      {successMessage && (
        <Alert type="success" message={successMessage} onClose={() => setSuccessMessage(null)} />
      )}
      {actionError && (
        <Alert type="error" message={actionError} onClose={() => setActionError(null)} />
      )}

      {addresses.length === 0 ? (
        <p className="py-12 text-center text-gray-500">No saved addresses.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <Card key={address.id} className={address.is_default ? 'ring-2 ring-primary-500' : ''}>
              <div className="flex items-start justify-between gap-2">
                <address className="space-y-0.5 text-sm not-italic text-gray-700">
                  <p className="font-medium text-gray-900">{address.full_name}</p>
                  <p>{address.street_house}</p>
                  <p>
                    {address.commune_sangkat}, {address.district_khan}
                  </p>
                  <p>{address.province}</p>
                  <p className="text-gray-500">{address.phone}</p>
                  {address.is_default && (
                    <span className="mt-1 inline-block rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700">
                      Default
                    </span>
                  )}
                </address>
                <div className="flex shrink-0 gap-2">
                  <Button variant="outline" onClick={() => openEdit(address)}>
                    Edit
                  </Button>
                  <Button variant="danger" onClick={() => setDeletingId(address.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Address' : 'Add Address'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <FormInput
            label="Full name"
            name="full_name"
            value={newValues.full_name}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.full_name}
            touched={touched.full_name}
            required
          />
          <FormInput
            label="Phone"
            name="phone"
            type="tel"
            value={newValues.phone}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.phone}
            touched={touched.phone}
            required
          />
          <FormInput
            label="Province"
            name="province"
            value={newValues.province}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.province}
            touched={touched.province}
            required
          />
          <FormInput
            label="District / Khan"
            name="district_khan"
            value={newValues.district_khan}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.district_khan}
            touched={touched.district_khan}
            required
          />
          <FormInput
            label="Commune / Sangkat"
            name="commune_sangkat"
            value={newValues.commune_sangkat}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.commune_sangkat}
            touched={touched.commune_sangkat}
            required
          />
          <FormInput
            label="Street & House No."
            name="street_house"
            value={newValues.street_house}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.street_house}
            touched={touched.street_house}
            required
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={newValues.is_default === 'true'}
              onChange={(e) => setValue('is_default', e.target.checked ? 'true' : 'false')}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            Set as default address
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting} loadingLabel="Saving...">
              {editingId ? 'Save Changes' : 'Add Address'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={deletingId !== null}
        title="Delete Address"
        message="Are you sure you want to delete this address?"
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
        isProcessing={isDeleting}
      />
    </div>
  )
}

export default AddressesPage
