import type { FC } from 'react';
import React, { memo } from 'react';

import type { SlimGroup, SlimUser } from '@bangumi/client/group';
import { Avatar, Topic, Typography } from '@bangumi/design';
import { getUserProfileLink } from '@bangumi/utils/pages';

import styles from './GroupTopicHeader.module.less';

interface Header {
  title: string;
  createdAt: number;
  creator: SlimUser;
  parent: SlimGroup;
  id: number;
}

const Link = Typography.Link;
const CommentInfo = Topic.CommentInfo;

const GroupTopicHeader: FC<Header> = ({ title, createdAt, creator, parent, id }) => {
  return (
    <div className={styles.groupTopicHeader}>
      <Avatar src={creator.avatar.large} size='medium' />
      <div className={styles.headerMain}>
        <span className={styles.navBar}>
          <div>
            <Link to={getUserProfileLink(creator.username)} isExternal>
              {creator.nickname}
            </Link>
            <span>发表于</span>
            <Link to={`/group/${parent.name}`}>{parent.title}</Link>
            <span>»</span>
            <Link to={`/group/${parent.name}/forum`}>组内讨论</Link>
          </div>
          <CommentInfo createdAt={createdAt} floor='1' id={id} />
        </span>
        <h1 className={styles.title}>{title}</h1>
      </div>
    </div>
  );
};

export default memo(GroupTopicHeader);
