import { Check, X } from 'lucide-react'
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import type { CitationDraft, LookupOption, QaEntry, QaEntryUpsertRequest, Subgroup } from '../../lib/types'
import CitationBuilder from './CitationBuilder'
import KeyPointsBuilder from './KeyPointsBuilder'

const ROLE_OPTIONS = [
  { value: 'patient', label: 'Bệnh nhân' },
  { value: 'doctor', label: 'Bác sĩ' },
  { value: 'caregiver', label: 'Người chăm sóc' },
]

const REQUIRED_FIELD_MESSAGE = 'Thông tin này cần được điền'
const REQUIRED_CITATION_MESSAGE = 'Cần ít nhất 1 trích dẫn bắt buộc: nhập tên tài liệu + vị trí và ít nhất 1 ý'

interface FormState {
  role: string
  diseaseOrTopic: string
  query: string
  expectedBehavior: string
  expertGoldAnswer: string
  requiredKeyPoints: string[]
  safetyNotes: string
  annotatorName: string
  reviewStatus: string
  noteForExpert: string
  mustHaveCitations: CitationDraft[]
  optionalCitations: CitationDraft[]
}

type FormErrors = Partial<Record<'query' | 'diseaseOrTopic' | 'expertGoldAnswer' | 'annotatorName' | 'mustHaveCitations', string>>

function blankForm(annotatorName: string, expectedBehaviors: LookupOption[], reviewStatuses: LookupOption[]): FormState {
  return {
    role: 'patient',
    diseaseOrTopic: '',
    query: '',
    expectedBehavior: expectedBehaviors[0]?.value ?? '',
    expertGoldAnswer: '',
    requiredKeyPoints: [''],
    safetyNotes: '',
    annotatorName,
    reviewStatus: reviewStatuses.find((status) => status.value === 'draft')?.value ?? reviewStatuses[0]?.value ?? '',
    noteForExpert: '',
    mustHaveCitations: [],
    optionalCitations: [],
  }
}

function formFromEntry(entry: QaEntry): FormState {
  const toDraft = (citation: QaEntry['citations'][number]): CitationDraft => ({
    kind: citation.kind,
    chunk_id: citation.chunk_id,
    manual_doc_name: citation.manual_doc_name,
    manual_location: citation.manual_location,
    points: citation.points.length ? citation.points.map((point) => point.content) : [''],
  })
  return {
    role: entry.role,
    diseaseOrTopic: entry.disease_or_topic,
    query: entry.query,
    expectedBehavior: entry.expected_behavior,
    expertGoldAnswer: entry.expert_gold_answer,
    requiredKeyPoints: entry.required_key_points.length ? entry.required_key_points : [''],
    safetyNotes: entry.safety_notes ?? '',
    annotatorName: entry.annotator_name,
    reviewStatus: entry.review_status,
    noteForExpert: entry.note_for_expert ?? '',
    mustHaveCitations: entry.citations.filter((c) => c.kind === 'must_have').map(toDraft),
    optionalCitations: entry.citations.filter((c) => c.kind === 'optional').map(toDraft),
  }
}

function hasUsableSource(citation: CitationDraft): boolean {
  return Boolean(citation.manual_doc_name?.trim() && citation.manual_location?.trim())
}

function validateForm(form: FormState): FormErrors {
  const errors: FormErrors = {}
  if (!form.query.trim()) errors.query = REQUIRED_FIELD_MESSAGE
  if (!form.diseaseOrTopic.trim()) errors.diseaseOrTopic = REQUIRED_FIELD_MESSAGE
  if (!form.expertGoldAnswer.trim()) errors.expertGoldAnswer = REQUIRED_FIELD_MESSAGE
  if (!form.annotatorName.trim()) errors.annotatorName = REQUIRED_FIELD_MESSAGE

  const hasValidMustHave = form.mustHaveCitations.some(
    (citation) => hasUsableSource(citation) && citation.points.some((point) => point.trim()),
  )
  if (!hasValidMustHave) errors.mustHaveCitations = REQUIRED_CITATION_MESSAGE

  return errors
}

export interface EntryFormHandle {
  fillQuery: (query: string) => void
  reset: () => void
}

interface EntryFormProps {
  subgroup: Subgroup
  annotatorName: string
  expectedBehaviors: LookupOption[]
  reviewStatuses: LookupOption[]
  editingEntry: QaEntry | null
  onCancelEdit: () => void
  onSubmit: (payload: QaEntryUpsertRequest) => Promise<void>
  submitting: boolean
  errorMessage: string | null
}

function RequiredMark() {
  return <span className="required-mark">*</span>
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <div className="field-error-text">{message}</div>
}

function EntryFormImpl(
  {
    subgroup,
    annotatorName,
    expectedBehaviors,
    reviewStatuses,
    editingEntry,
    onCancelEdit,
    onSubmit,
    submitting,
    errorMessage,
  }: EntryFormProps,
  ref: React.Ref<EntryFormHandle>,
) {
  const [form, setForm] = useState<FormState>(() => blankForm(annotatorName, expectedBehaviors, reviewStatuses))
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({})

  useEffect(() => {
    if (editingEntry) {
      setForm(formFromEntry(editingEntry))
    } else {
      setForm(blankForm(annotatorName, expectedBehaviors, reviewStatuses))
    }
    setFieldErrors({})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingEntry, subgroup.subgroup_id])

  useImperativeHandle(ref, () => ({
    fillQuery: (query: string) => setForm((prev) => ({ ...prev, query })),
    reset: () => {
      setForm(blankForm(annotatorName, expectedBehaviors, reviewStatuses))
      setFieldErrors({})
    },
  }))

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const errors = validateForm(form)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})

    const stripDraft = (citation: CitationDraft) => ({
      kind: citation.kind,
      chunk_id: citation.chunk_id,
      manual_doc_name: citation.manual_doc_name,
      manual_location: citation.manual_location,
      points: citation.points.filter((point) => point.trim().length > 0),
    })
    const payload: QaEntryUpsertRequest = {
      subgroup_id: subgroup.subgroup_id,
      role: form.role,
      disease_or_topic: form.diseaseOrTopic,
      query: form.query,
      expected_behavior: form.expectedBehavior,
      expert_gold_answer: form.expertGoldAnswer,
      required_key_points: form.requiredKeyPoints.filter((point) => point.trim().length > 0),
      safety_notes: form.safetyNotes.trim() || null,
      annotator_name: form.annotatorName,
      review_status: form.reviewStatus,
      note_for_expert: form.noteForExpert.trim() || null,
      citations: [...form.mustHaveCitations, ...form.optionalCitations].map(stripDraft),
    }
    await onSubmit(payload)
  }

  const remaining = Math.max(0, subgroup.target_count - subgroup.done_count)
  const isEditing = editingEntry !== null

  return (
    <div className="card">
      <div className="entry-form-header">
        <h3>{isEditing ? '✎ Chỉnh sửa câu hỏi' : '➕ Thêm câu hỏi mới'}</h3>
        {isEditing && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={onCancelEdit}>
            <X size={13} /> Huỷ chỉnh sửa
          </button>
        )}
      </div>

      {errorMessage && (
        <div className="alert alert-error">
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex-col gap-4" noValidate>
        <div className="form-group">
          <label className="form-label">
            1 · Câu hỏi <RequiredMark />
          </label>
          <textarea
            className={`form-textarea${fieldErrors.query ? ' has-error' : ''}`}
            rows={2}
            value={form.query}
            onChange={(event) => update('query', event.target.value)}
            placeholder="VD: Tôi ho kéo dài hơn 2 tuần thì có cần nghĩ đến bệnh lao không?"
          />
          <FieldError message={fieldErrors.query} />
        </div>

        <div className="form-row-2">
          <div className="form-group">
            <label className="form-label">
              Người hỏi <RequiredMark />
            </label>
            <select className="form-select" value={form.role} onChange={(event) => update('role', event.target.value)}>
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">
              Bệnh / chủ đề <RequiredMark />
            </label>
            <input
              type="text"
              className={`form-input${fieldErrors.diseaseOrTopic ? ' has-error' : ''}`}
              value={form.diseaseOrTopic}
              onChange={(event) => update('diseaseOrTopic', event.target.value)}
              placeholder="VD: Bệnh lao"
            />
            <FieldError message={fieldErrors.diseaseOrTopic} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">
            Hành vi kỳ vọng của chatbot <RequiredMark />
          </label>
          <select
            className="form-select"
            value={form.expectedBehavior}
            onChange={(event) => update('expectedBehavior', event.target.value)}
          >
            {expectedBehaviors.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">
            2 · Trích dẫn bắt buộc <RequiredMark />
          </label>
          <CitationBuilder
            kind="must_have"
            citations={form.mustHaveCitations}
            onChange={(citations) => update('mustHaveCitations', citations)}
          />
          <FieldError message={fieldErrors.mustHaveCitations} />
        </div>

        <div className="form-group">
          <label className="form-label">Trích dẫn bổ trợ</label>
          <CitationBuilder
            kind="optional"
            citations={form.optionalCitations}
            onChange={(citations) => update('optionalCitations', citations)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            3 · Câu trả lời chuẩn <RequiredMark />
          </label>
          <textarea
            className={`form-textarea${fieldErrors.expertGoldAnswer ? ' has-error' : ''}`}
            rows={4}
            value={form.expertGoldAnswer}
            onChange={(event) => update('expertGoldAnswer', event.target.value)}
            placeholder="Câu trả lời chuẩn, đúng theo guideline, dùng làm mốc để đánh giá câu trả lời của chatbot."
          />
          <FieldError message={fieldErrors.expertGoldAnswer} />
        </div>

        <div className="form-group">
          <label className="form-label">Các ý bắt buộc phải có trong câu trả lời</label>
          <KeyPointsBuilder
            points={form.requiredKeyPoints}
            onChange={(points) => update('requiredKeyPoints', points)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Lưu ý an toàn</label>
          <textarea
            className="form-textarea"
            rows={2}
            value={form.safetyNotes}
            onChange={(event) => update('safetyNotes', event.target.value)}
            placeholder="VD: Không chẩn đoán chắc; khuyên đi khám nếu có dấu hiệu nặng."
          />
        </div>

        <div className="form-row-2">
          <div className="form-group">
            <label className="form-label">
              Người điền <RequiredMark />
            </label>
            <input
              type="text"
              className={`form-input${fieldErrors.annotatorName ? ' has-error' : ''}`}
              value={form.annotatorName}
              onChange={(event) => update('annotatorName', event.target.value)}
            />
            <FieldError message={fieldErrors.annotatorName} />
          </div>
          <div className="form-group">
            <label className="form-label">Trạng thái duyệt</label>
            <select
              className="form-select"
              value={form.reviewStatus}
              onChange={(event) => update('reviewStatus', event.target.value)}
            >
              {reviewStatuses.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Ghi chú cho chuyên gia (tuỳ chọn)</label>
          <textarea
            className="form-textarea"
            rows={2}
            value={form.noteForExpert}
            onChange={(event) => update('noteForExpert', event.target.value)}
          />
        </div>

        <div className="flex items-center gap-3" style={{ borderTop: '1px dashed var(--border)', paddingTop: 16 }}>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            <Check size={14} /> {isEditing ? 'Cập nhật câu hỏi' : 'Lưu câu hỏi'}
          </button>
          <div className="flex-1" />
          {!isEditing && (
            <span className="form-hint">
              Còn thiếu <b>{remaining}</b> câu cho loại này
            </span>
          )}
        </div>
      </form>
    </div>
  )
}

const EntryForm = forwardRef(EntryFormImpl)
export default EntryForm
