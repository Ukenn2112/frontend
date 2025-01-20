import React, { useState } from 'react';
import type { SubmitErrorHandler, SubmitHandler } from 'react-hook-form';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { ozaClient } from '@bangumi/client';
import { EditorForm, Form, Input, toast } from '@bangumi/design';
import { useTurnstile } from 'react-turnstile';
import type { TopicDetail } from '@bangumi/client/group';

import styles from './TopicForm.module.less';

interface FormData {
  title: string;
  text: string;
  // Add cf-turnstile-response to the form data
  'cf-turnstile-response': string;
}

export interface TopicFormProps {
  quickPost?: boolean;
  /** 小组 slug name，指定此参数时为发表话题 */
  groupName?: string;
  /** 话题，指定此参数时为修改话题 */
  topic?: {
    data: TopicDetail;
    mutate: (data: TopicDetail) => void;
  };
}

/**
 * 发表新话题或修改话题
 *
 * groupName 和 topic 必须且只能指定其一
 */
const TopicForm = ({ quickPost = false, groupName, topic }: TopicFormProps) => {
  if ((!!groupName && !!topic) || (!groupName && !topic)) {
    throw Error('Invalid usage: should specify either groupName or topic');
  }

  const navigate = useNavigate();

  const { register, handleSubmit, control, setValue } = useForm<FormData>({
    // Sync topic title, text with form data but not cf-turnstile-response
    defaultValues: {
      title: topic?.data.title,
      text: topic?.data.text,
    },
  });
  const [sending, setSending] = useState(false);
  const { execute } = useTurnstile();

  const postNewTopic = async (data: FormData, groupName: string) => {
    const { title, text, ['cf-turnstile-response']: token } = data;
    // `CreateTopic` was renamed to `createTopic`
    const response = await ozaClient.createNewGroupTopic(groupName, {
      title,
      text,
      'cf-turnstile-response': token,
    });
    if (response.status === 200) {
      navigate(`/group/topic/${response.data.id}`);
    } else {
      console.error(response);
      toast(response.data.message);
    }
  };

  const editTopic = async (data: FormData, id: number) => {
    const { title, text, ['cf-turnstile-response']: token } = data;
    // `CreateTopic` was renamed to `createTopic`
    const response = await ozaClient.editGroupTopic(id, {
      title,
      text,
      'cf-turnstile-response': token,
    });
    if (response.status === 200) {
      // Exclude cf-turnstile-response from the data to mutate
      topic?.mutate({ ...topic.data, title, text });
      navigate(`/group/topic/${id}`);
    } else {
      console.error(response);
      toast(response.data.message);
    }
  };

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setSending(true);
    const token = await execute();
    if (token) {
      setValue('cf-turnstile-response', token);
      if (groupName) {
        await postNewTopic(data, groupName);
      } else if (topic) {
        await editTopic(data, topic.data.id);
      }
    }
    setSending(false);
  };

  const showErrors: SubmitErrorHandler<FormData> = (errors) => {
    toast(Object.values(errors).map((field) => field.message)[0]!);
  };

  const FormInput = ({ quickPost = false }: TopicFormProps) => (
    <Input
      rounded
      placeholder={quickPost ? '给新帖取一个标题' : '取个标题…'}
      {...register('title', { required: '请填写标题' })}
    />
  );

  const FormEditor = ({ quickPost = false }: TopicFormProps) => (
    <Controller
      name='text'
      control={control}
      rules={{ required: '请填写正文内容' }}
      render={({ field }) => (
        <EditorForm
          placeholder={quickPost ? '想聊点什么的呢…' : '话题正文…'}
          hideCancel
          onConfirm={async () => handleSubmit(onSubmit, showErrors)()}
          // TODO: use loading state
          confirmText={sending ? '...' : quickPost ? '快速发帖' : undefined}
          rows={!quickPost ? 15 : undefined}
          {...field}
        />
      )}
    />
  );

  if (quickPost) {
    return (
      <Form
        compact
        className={styles.quickPostForm}
        // 统一由 EditorForm 的 onConfirm 处理
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <FormInput quickPost />
        <FormEditor quickPost />
      </Form>
    );
  }

  return (
    <>
      <div className={styles.titleInput}>
        <FormInput />
      </div>
      <div className={styles.contentEditor}>
        <FormEditor />
      </div>
    </>
  );
};

export default TopicForm;
