import { baseApi } from './baseApi';
import type {
  DailyProgressEntry,
  DailyProgressWrite,
  ItemCatalogEntry,
  ModuleCatalogEntry,
  ProgressTaskTemplate,
  ProgressTaskTemplateWrite,
  SiteProgressTask,
  SiteProgressTaskWrite,
  KPICategory,
  KPICategoryWrite,
} from '@/types/dailyProgress';

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

export const progressApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProgressTaskTemplates: builder.query<
      ListResponse<ProgressTaskTemplate>,
      { page_size?: number; is_active?: string; category?: string } | void
    >({
      query: (params) => ({
        url: '/api/v1/progress-task-templates/',
        params: params ?? {},
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'ProgressTaskTemplate' as const, id })),
              { type: 'ProgressTaskTemplate', id: 'LIST' },
            ]
          : [{ type: 'ProgressTaskTemplate', id: 'LIST' }],
    }),
    getKPICategories: builder.query<
      ListResponse<KPICategory>,
      { site_id?: string; page_size?: number } | void
    >({
      query: (params) => ({
        url: '/api/v1/kpi-categories/',
        params: params ?? {},
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'KPICategory' as const, id })),
              { type: 'KPICategory', id: 'LIST' },
            ]
          : [{ type: 'KPICategory', id: 'LIST' }],
    }),
    createKPICategory: builder.mutation<KPICategory, KPICategoryWrite>({
      query: (body) => ({
        url: '/api/v1/kpi-categories/',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'KPICategory', id: 'LIST' }],
    }),
    deleteKPICategory: builder.mutation<void, string>({
      query: (id) => ({
        url: `/api/v1/kpi-categories/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'KPICategory', id: 'LIST' }],
    }),
    updateKPICategory: builder.mutation<KPICategory, { id: string; data: Partial<KPICategoryWrite> }>(
      {
        query: ({ id, data }) => ({
          url: `/api/v1/kpi-categories/${id}/`,
          method: 'PATCH',
          body: data,
        }),
        invalidatesTags: [{ type: 'KPICategory', id: 'LIST' }],
      }
    ),
    createProgressTaskTemplate: builder.mutation<ProgressTaskTemplate, ProgressTaskTemplateWrite>({
      query: (body) => ({
        url: '/api/v1/progress-task-templates/',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'ProgressTaskTemplate', id: 'LIST' }],
    }),
    updateProgressTaskTemplate: builder.mutation<
      ProgressTaskTemplate,
      { id: string; data: Partial<ProgressTaskTemplateWrite> }
    >({
      query: ({ id, data }) => ({
        url: `/api/v1/progress-task-templates/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'ProgressTaskTemplate', id },
        { type: 'ProgressTaskTemplate', id: 'LIST' },
      ],
    }),
    deleteProgressTaskTemplate: builder.mutation<void, string>({
      query: (id) => ({
        url: `/api/v1/progress-task-templates/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'ProgressTaskTemplate', id: 'LIST' }],
    }),

    getSiteProgressTasks: builder.query<
      ListResponse<SiteProgressTask>,
      { site_id?: string; is_active?: string; page_size?: number } | void
    >({
      query: (params) => ({
        url: '/api/v1/site-progress-tasks/',
        params: params ?? {},
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'SiteProgressTask' as const, id })),
              { type: 'SiteProgressTask', id: 'LIST' },
            ]
          : [{ type: 'SiteProgressTask', id: 'LIST' }],
    }),
    getModuleCatalog: builder.query<ListResponse<ModuleCatalogEntry>, { q?: string } | void>({
      query: (params) => ({
        url: '/api/v1/module-catalog/',
        params: params ?? {},
      }),
    }),
    getItemCatalog: builder.query<ListResponse<ItemCatalogEntry>, { q?: string } | void>({
      query: (params) => ({
        url: '/api/v1/item-catalog/',
        params: params ?? {},
      }),
    }),
    createSiteProgressTask: builder.mutation<SiteProgressTask, SiteProgressTaskWrite>({
      query: (body) => ({
        url: '/api/v1/site-progress-tasks/',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'SiteProgressTask', id: 'LIST' }],
    }),
    updateSiteProgressTask: builder.mutation<
      SiteProgressTask,
      { id: string; data: Partial<SiteProgressTaskWrite> }
    >({
      query: ({ id, data }) => ({
        url: `/api/v1/site-progress-tasks/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'SiteProgressTask', id },
        { type: 'SiteProgressTask', id: 'LIST' },
      ],
    }),
    deleteSiteProgressTask: builder.mutation<void, string>({
      query: (id) => ({
        url: `/api/v1/site-progress-tasks/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'SiteProgressTask', id: 'LIST' }],
    }),

    getDailyProgress: builder.query<
      ListResponse<DailyProgressEntry>,
      {
        site_id?: string;
        site_task_id?: string;
        date?: string;
        date_from?: string;
        date_to?: string;
        page_size?: number;
      } | void
    >({
      query: (params) => ({
        url: '/api/v1/daily-progress/',
        params: params ?? {},
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'DailyProgress' as const, id })),
              { type: 'DailyProgress', id: 'LIST' },
            ]
          : [{ type: 'DailyProgress', id: 'LIST' }],
    }),
    createDailyProgress: builder.mutation<DailyProgressEntry, DailyProgressWrite>({
      query: (body) => ({
        url: '/api/v1/daily-progress/',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'DailyProgress', id: 'LIST' },
        { type: 'SiteProgressTask', id: 'LIST' },
        { type: 'BoqItem', id: 'LIST' },
        { type: 'Boq', id: 'LIST' },
      ],
    }),
    updateDailyProgress: builder.mutation<
      DailyProgressEntry,
      { id: string; data: Partial<DailyProgressWrite> }
    >({
      query: ({ id, data }) => ({
        url: `/api/v1/daily-progress/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'DailyProgress', id },
        { type: 'DailyProgress', id: 'LIST' },
        { type: 'SiteProgressTask', id: 'LIST' },
        { type: 'BoqItem', id: 'LIST' },
        { type: 'Boq', id: 'LIST' },
      ],
    }),
    deleteDailyProgress: builder.mutation<void, string>({
      query: (id) => ({
        url: `/api/v1/daily-progress/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: [
        { type: 'DailyProgress', id: 'LIST' },
        { type: 'SiteProgressTask', id: 'LIST' },
        { type: 'BoqItem', id: 'LIST' },
        { type: 'Boq', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetProgressTaskTemplatesQuery,
  useCreateProgressTaskTemplateMutation,
  useUpdateProgressTaskTemplateMutation,
  useDeleteProgressTaskTemplateMutation,
  useGetKPICategoriesQuery,
  useCreateKPICategoryMutation,
  useDeleteKPICategoryMutation,
  useGetSiteProgressTasksQuery,
  useCreateSiteProgressTaskMutation,
  useUpdateSiteProgressTaskMutation,
  useDeleteSiteProgressTaskMutation,
  useGetDailyProgressQuery,
  useCreateDailyProgressMutation,
  useUpdateDailyProgressMutation,
  useDeleteDailyProgressMutation,
  useGetModuleCatalogQuery,
  useGetItemCatalogQuery,
  useUpdateKPICategoryMutation,
} = progressApi;
