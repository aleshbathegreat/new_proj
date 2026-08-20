import { baseApi } from './baseApi';
import type { BOQTemplate, BOQTemplateWrite } from '@/types/boqTemplate';

interface CursorPagination {
  next_cursor: string | null;
  previous_cursor: string | null;
  page_size: number;
  has_more: boolean;
}

interface ListResponse<T> {
  data: T[];
  pagination: CursorPagination;
}

interface BoqTemplateListParams {
  page_size?: number;
  is_active?: string;
}

export const boqTemplateApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBoqTemplates: builder.query<ListResponse<BOQTemplate>, BoqTemplateListParams | void>({
      query: (params) => ({
        url: '/api/v1/boq-templates/',
        params: params ?? {},
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'BoqTemplate' as const, id })),
              { type: 'BoqTemplate', id: 'LIST' },
            ]
          : [{ type: 'BoqTemplate', id: 'LIST' }],
    }),
    getBoqTemplate: builder.query<BOQTemplate, string>({
      query: (id) => `/api/v1/boq-templates/${id}/`,
      providesTags: (_r, _e, id) => [{ type: 'BoqTemplate', id }],
    }),
    createBoqTemplate: builder.mutation<BOQTemplate, BOQTemplateWrite>({
      query: (body) => ({
        url: '/api/v1/boq-templates/',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'BoqTemplate', id: 'LIST' }],
    }),
    updateBoqTemplate: builder.mutation<BOQTemplate, { id: string; data: Partial<BOQTemplateWrite> }>({
      query: ({ id, data }) => ({
        url: `/api/v1/boq-templates/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'BoqTemplate', id },
        { type: 'BoqTemplate', id: 'LIST' },
      ],
    }),
    deleteBoqTemplate: builder.mutation<void, string>({
      query: (id) => ({
        url: `/api/v1/boq-templates/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'BoqTemplate', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetBoqTemplatesQuery,
  useGetBoqTemplateQuery,
  useCreateBoqTemplateMutation,
  useUpdateBoqTemplateMutation,
  useDeleteBoqTemplateMutation,
} = boqTemplateApi;