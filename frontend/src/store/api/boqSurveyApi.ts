import { baseApi } from './baseApi';
import type { BOQSurveyData } from '@/types/boqSurvey';

interface SurveyResponse {
  data: BOQSurveyData;
}

export const boqSurveyApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBOQSurveyData: builder.query<BOQSurveyData, string>({
      query: (boqId) => `/api/v1/boq/${boqId}/survey-data/`,
      providesTags: (_r, _e, boqId) => [{ type: 'BoqSurveyData', id: boqId }],
    }),
    
    uploadBOQSurveyData: builder.mutation<BOQSurveyData, { boqId: string; file: File }>({
      query: ({ boqId, file }) => {
        const formData = new FormData();
        formData.append('file', file);
        return {
          url: `/api/v1/boq/${boqId}/survey-data/`,
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: (_r, _e, { boqId }) => [{ type: 'BoqSurveyData', id: boqId }],
    }),
    
    deleteBOQSurveyData: builder.mutation<void, { boqId: string; surveyId: string }>({
      query: ({ boqId, surveyId }) => ({
        url: `/api/v1/boq/${boqId}/survey-data/${surveyId}/`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, { boqId }) => [{ type: 'BoqSurveyData', id: boqId }],
    }),
  }),
});

export const {
  useGetBOQSurveyDataQuery,
  useUploadBOQSurveyDataMutation,
  useDeleteBOQSurveyDataMutation,
} = boqSurveyApi;