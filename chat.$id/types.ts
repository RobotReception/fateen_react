import { type components } from '@/apiType'
import {
  type NonNullableArrayElement,
  type RequiredNonNullableProperties,
} from '@/types/utility'

export type CommentsType = RequiredNonNullableProperties<
  NonNullableArrayElement<
    components['schemas']['MappedTicketCommentsPagedList']['data']
  >
>
export type FieldValuesEdit = RequiredNonNullableProperties<
  components['schemas']['GetTicketComment']
>
