import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { settings } from '../settings.config';
import { Image } from '../../models/image';

@Injectable({
  providedIn: 'root'
})
export class FileService {

  constructor(private http: HttpClient) { }

  public uploadPictures(files: File[], itemId: string) : Observable<string> {
    if (files.length == 0) {
      return of("Successfully uploaded no files");
    }

    const formData = new FormData();

    for (let file of files) {
      formData.append('images', file);
    }
    formData.append('itemId', itemId)
    console.log(formData.getAll('images'));
    

    return this.http.post<string>(settings.apiRoute + '/AuctionItemsPictures/upload', formData)
  }

  public getItemPictures(itemId: string): Observable<Image[]> {
    return this.http.get<Image[]>(settings.apiRoute + '/AuctionItemsPictures/get/' + itemId)
  }

  public isPicture(file: File): boolean {
    const pictureExtensions = ['jpg', 'jpeg', 'png', 'gif', 'jfif'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    return fileExtension ? pictureExtensions.includes(fileExtension) : false;
  }
  public containsFile(file: File, files: File[]): boolean  {
    for (const f of files) {
      if (f.name === file.name && f.size === file.size && f.type === file.type) {
        return true;
      }
    }
    return false;
  }
}
