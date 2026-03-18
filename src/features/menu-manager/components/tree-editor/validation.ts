// ══════════════════════════════════════════════════════════════
//  Meta WhatsApp API — Validation Rules for Menu Tree Editor
//  Based on official Meta API content limits
// ══════════════════════════════════════════════════════════════

import type { MenuItemType } from "../../types"

/** Validation error with field key and Arabic message */
export interface ValidationErrors {
    [fieldKey: string]: string
}

/** Character count info for real-time counters */
export interface CharCountInfo {
    count: number
    max: number
    isOver: boolean
    /** Percentage used (0-100+) */
    pct: number
    /** Color: gray < 80%, amber 80-99%, red >= 100% */
    color: string
}

// ── Content Form State (imported type reference) ──
interface ContentFormState {
    reply: string; format: string
    presHeader: string; presFooter: string; presButton: string
    actionType: string; actionParams: string
    assets: { asset_id: string; caption: string; fileName?: string }[]
    listText: string
    listItems: { id: string; title: string; description: string; target_key: string }[]
    // api_call fields
    apiUrl: string; apiMethod: string; apiTimeout: number; apiRetryCount: number
    apiExecMode: string; apiCollectionStrategy: string; apiInitialMsg: string
    apiHeaders: string; apiBodyTemplate: string; apiQueryParams: string
    apiSuccessTemplate: string; apiErrorTemplate: string
    apiAuthType: string; apiAuthConfig: string
    apiRequiresConfirmation: boolean; apiConfirmationTemplate: string
    apiResponseType: string; apiResponseMapping: string
    apiConditionalResponses: { condition: string; template: string }[]
    apiMediaUrlPath: string; apiMediaType: string; apiMediaCaptionTemplate: string
    apiInputs: {
        key: string; label: string; type: string; required: boolean; order: number
        prompt_message: string; error_message: string; placeholder: string; default_value: string
        validation_regex: string; min_value: string; max_value: string; min_length: string; max_length: string; type_error: string
        options: { value: string; label: string }[]; display_as: string
        options_source: string; image_analysis: string; api_call_config: string
        trigger_after: string; depends_on: string; show_condition: string
        formula: string; accepted_types: string; max_size_mb: string
        display_in_summary: boolean; filter_options: boolean
        cross_validation: string; default_when: string
    }[]
}

// ══════════════════════════════════════════════════════════════
//  Limits Constants (from Meta API documentation)
// ══════════════════════════════════════════════════════════════

export const LIMITS = {
    // general
    TITLE: 24,
    DESCRIPTION: 72,
    // submenu
    SUBMENU_HEADER: 60,
    SUBMENU_FOOTER: 60,
    SUBMENU_BUTTON: 20,
    // text
    TEXT_REPLY: 4096,
    // action
    ACTION_REPLY: 4096,
    // media
    MEDIA_CAPTION: 1024,
    // list
    LIST_TEXT: 1024,
    LIST_ITEMS_MIN: 1,
    LIST_ITEMS_MAX: 50,
    LIST_ITEM_ID: 200,
    LIST_ITEM_TITLE: 24,
    LIST_ITEM_DESC: 72,
    // api_call
    API_URL: 2048,
    API_SUCCESS_TEMPLATE: 4096,
    API_ERROR_TEMPLATE: 4096,
    API_CONFIRMATION_TEMPLATE: 4096,
    API_INITIAL_MSG: 4096,
} as const

// ══════════════════════════════════════════════════════════════
//  Character Counter Helper
// ══════════════════════════════════════════════════════════════

export function getCharCountInfo(value: string, max: number): CharCountInfo {
    const count = value.length
    const pct = max > 0 ? (count / max) * 100 : 0
    const isOver = count > max
    let color = "var(--t-text-faint, #9ca3af)" // gray
    if (pct >= 100) color = "#ef4444"           // red
    else if (pct >= 80) color = "#f59e0b"       // amber
    return { count, max, isOver, pct, color }
}

// ══════════════════════════════════════════════════════════════
//  Main Validation Function
// ══════════════════════════════════════════════════════════════

/**
 * Validate the content form based on Meta API rules.
 * Returns a map of { fieldKey → Arabic error message }.
 * Empty map = no errors.
 */
export function validateContentForm(
    type: MenuItemType,
    form: ContentFormState
): ValidationErrors {
    const errors: ValidationErrors = {}

    switch (type) {
        case "submenu": {
            if (form.presHeader.length > LIMITS.SUBMENU_HEADER)
                errors.presHeader = `العنوان طويل جداً (${form.presHeader.length}/${LIMITS.SUBMENU_HEADER} حرف)`
            if (form.presFooter.length > LIMITS.SUBMENU_FOOTER)
                errors.presFooter = `التذييل طويل جداً (${form.presFooter.length}/${LIMITS.SUBMENU_FOOTER} حرف)`
            if (form.presButton.length > LIMITS.SUBMENU_BUTTON)
                errors.presButton = `نص الزر طويل جداً (${form.presButton.length}/${LIMITS.SUBMENU_BUTTON} حرف)`
            break
        }

        case "text": {
            if (!form.reply.trim())
                errors.reply = "نص الرد مطلوب"
            else if (form.reply.length > LIMITS.TEXT_REPLY)
                errors.reply = `نص الرد طويل جداً (${form.reply.length}/${LIMITS.TEXT_REPLY} حرف)`
            if (form.format && form.format !== "plain" && form.format !== "markdown")
                errors.format = "التنسيق يجب أن يكون plain أو markdown"
            break
        }

        case "action": {
            if (!form.actionType.trim()) {
                // Action type is always "handoff" per the code, so check actionParams team_id
                // Actually the form always sets type to "handoff", but let's validate the team
                let params: Record<string, unknown> = {}
                try { if (form.actionParams.trim()) params = JSON.parse(form.actionParams) } catch { /* */ }
                if (!params.team_id)
                    errors.actionTeam = "يجب اختيار الفريق المستهدف"
            }
            if (form.reply.length > LIMITS.ACTION_REPLY)
                errors.reply = `رسالة الرد طويلة جداً (${form.reply.length}/${LIMITS.ACTION_REPLY} حرف)`
            break
        }

        case "images":
        case "files":
        case "videos":
        case "multi": {
            if (form.assets.length === 0)
                errors.assets = "يجب رفع ملف واحد على الأقل"
            form.assets.forEach((a, i) => {
                if (!a.asset_id.trim())
                    errors[`asset_${i}_id`] = `معرف الملف #${i + 1} مطلوب`
                if (a.caption.length > LIMITS.MEDIA_CAPTION)
                    errors[`asset_${i}_caption`] = `وصف الملف #${i + 1} طويل جداً (${a.caption.length}/${LIMITS.MEDIA_CAPTION})`
            })
            break
        }

        case "list": {
            if (form.listText.length > LIMITS.LIST_TEXT)
                errors.listText = `النص المصاحب طويل جداً (${form.listText.length}/${LIMITS.LIST_TEXT} حرف)`
            if (form.listItems.length === 0)
                errors.listItems = "يجب إضافة عنصر واحد على الأقل"
            else if (form.listItems.length > LIMITS.LIST_ITEMS_MAX)
                errors.listItems = `عدد العناصر تجاوز الحد الأقصى (${form.listItems.length}/${LIMITS.LIST_ITEMS_MAX})`

            form.listItems.forEach((li, i) => {
                if (!li.id.trim())
                    errors[`listItem_${i}_id`] = `معرف العنصر #${i + 1} مطلوب`
                else if (li.id.length > LIMITS.LIST_ITEM_ID)
                    errors[`listItem_${i}_id`] = `معرف العنصر #${i + 1} طويل جداً (${li.id.length}/${LIMITS.LIST_ITEM_ID})`
                if (!li.title.trim())
                    errors[`listItem_${i}_title`] = `عنوان العنصر #${i + 1} مطلوب`
                else if (li.title.length > LIMITS.LIST_ITEM_TITLE)
                    errors[`listItem_${i}_title`] = `عنوان العنصر #${i + 1} طويل جداً (${li.title.length}/${LIMITS.LIST_ITEM_TITLE})`
                if (li.description.length > LIMITS.LIST_ITEM_DESC)
                    errors[`listItem_${i}_desc`] = `وصف العنصر #${i + 1} طويل جداً (${li.description.length}/${LIMITS.LIST_ITEM_DESC})`
                if (!li.target_key.trim())
                    errors[`listItem_${i}_target`] = `هدف العنصر #${i + 1} مطلوب`
            })
            break
        }

        case "api_call": {
            if (!form.apiUrl.trim())
                errors.apiUrl = "رابط API مطلوب"
            break
        }
    }

    return errors
}

/**
 * Check if a title (used for all menu items) is valid.
 * Title is always required.
 */
export function validateTitle(title: string): string | null {
    if (!title.trim()) return "عنوان العنصر مطلوب"
    if (title.length > LIMITS.TITLE) return `العنوان طويل جداً (${title.length}/${LIMITS.TITLE} حرف)`
    return null
}

/**
 * Returns true if there are validation errors
 */
export function hasErrors(errors: ValidationErrors): boolean {
    return Object.keys(errors).length > 0
}
