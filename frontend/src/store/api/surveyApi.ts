import { baseApi } from './baseApi';
import type { Survey, SurveyItem, SurveyRowData, SurveyWrite } from '@/types/survey';

interface ListResponse<T> {
  data: T[];
}

export const surveyApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSurveys: builder.query<ListResponse<Survey>, { project_id?: string } | void>({
      query: (params) => ({ url: '/api/v1/surveys/', params: params ?? {} }),
      providesTags: (result) =>
        result
          ? [...result.data.map(({ id }) => ({ type: 'Survey' as const, id })), { type: 'Survey', id: 'LIST' }]
          : [{ type: 'Survey', id: 'LIST' }],
    }),
    getSurvey: builder.query<Survey, string>({
      query: (id) => `/api/v1/surveys/${id}/`,
      providesTags: (_r, _e, id) => [{ type: 'Survey', id }],
    }),
    createSurvey: builder.mutation<Survey, SurveyWrite>({
      query: (body) => ({ url: '/api/v1/surveys/', method: 'POST', body }),
      invalidatesTags: [{ type: 'Survey', id: 'LIST' }],
    }),
    updateSurvey: builder.mutation<Survey, { id: string; data: Partial<SurveyWrite> }>({
      query: ({ id, data }) => ({ url: `/api/v1/surveys/${id}/`, method: 'PATCH', body: data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Survey', id }, { type: 'Survey', id: 'LIST' }],
    }),
    deleteSurvey: builder.mutation<void, string>({
      query: (id) => ({ url: `/api/v1/surveys/${id}/`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Survey', id: 'LIST' }],
    }),
    getSurveyItems: builder.query<{ data: SurveyItem[] }, string>({
      query: (surveyId) => `/api/v1/surveys/${surveyId}/items/`,
      providesTags: (_r, _e, surveyId) => [{ type: 'SurveyItem', id: surveyId }],
    }),
    bulkReplaceSurveyItems: builder.mutation<{ data: SurveyItem[] }, { surveyId: string; rows: SurveyRowData[] }>({
      query: ({ surveyId, rows }) => ({
        url: `/api/v1/surveys/${surveyId}/items/bulk/`,
        method: 'POST',
        body: rows,
      }),
      invalidatesTags: (_r, _e, { surveyId }) => [
        { type: 'SurveyItem', id: surveyId },
        { type: 'Survey', id: surveyId },
        { type: 'Survey', id: 'LIST' },
      ],
    }),
    createSurveyItem: builder.mutation<SurveyItem, { surveyId: string; data: SurveyRowData }>({
      query: ({ surveyId, data }) => ({
        url: '/api/v1/survey-items/',
        method: 'POST',
        body: { survey_id: surveyId, data },
      }),
      invalidatesTags: (_r, _e, { surveyId }) => [
        { type: 'SurveyItem', id: surveyId },
        { type: 'Survey', id: surveyId },
      ],
    }),
    updateSurveyItem: builder.mutation<SurveyItem, { id: string; surveyId: string; data: SurveyRowData }>({
      query: ({ id, data }) => ({
        url: `/api/v1/survey-items/${id}/`,
        method: 'PATCH',
        body: { data },
      }),
      invalidatesTags: (_r, _e, { surveyId }) => [{ type: 'SurveyItem', id: surveyId }],
    }),
    deleteSurveyItem: builder.mutation<void, { id: string; surveyId: string }>({
      query: ({ id }) => ({ url: `/api/v1/survey-items/${id}/`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, { surveyId }) => [
        { type: 'SurveyItem', id: surveyId },
        { type: 'Survey', id: surveyId },
      ],
    }),
  }),
});

export const {
  useGetSurveysQuery,
  useGetSurveyQuery,
  useCreateSurveyMutation,
  useUpdateSurveyMutation,
  useDeleteSurveyMutation,
  useGetSurveyItemsQuery,
  useBulkReplaceSurveyItemsMutation,
  useCreateSurveyItemMutation,
  useUpdateSurveyItemMutation,
  useDeleteSurveyItemMutation,
} = surveyApi;