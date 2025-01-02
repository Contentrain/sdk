import type { IBaseModel } from '../../types/base'

export interface IBlogPost extends IBaseModel {
  title: string
  content: string
  author: string
  authorData?: IAuthor
}

export interface IAuthor extends IBaseModel {
  name: string
  bio: string
} 