import { File, FormData } from 'formdata-node';
import type { FormDataEntryValue } from 'formdata-node';
import { fileFromPath } from 'formdata-node/file-from-path';

export type FormDataResolvable =
| Array<FormDataResolvable>
| { [key: string]: FormDataResolvable }
| FormDataEntryValue
| undefined
| boolean
| number
| Blob
| Date
| null;

export const file = fileFromPath;

export function convert(
  source: Record<string, FormDataResolvable>,
  form: FormData = new FormData(),
  parentKey: string | null = null,
): FormData {
  source = source || {};

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      append(form, toKey(parentKey, key), source[key]);
    }
  }

  return form;
}

function append(form: FormData, key: string, value: FormDataResolvable): void {
  if (Array.isArray(value)) {
    return Array.from(value.keys()).forEach(index => append(form, toKey(key, index.toString()), value[index]));
  }
  else if (value instanceof Date) {
    return form.append(key, value.toISOString());
  }
  else if (value instanceof File) {
    return form.append(key, value, value.name);
  }
  else if (value instanceof Blob) {
    return form.append(key, value);
  }
  else if (typeof value === 'boolean') {
    return form.append(key, value ? '1' : '0');
  }
  else if (typeof value === 'string') {
    return form.append(key, value);
  }
  else if (typeof value === 'number') {
    return form.append(key, `${value}`);
  }
  else if (value === null || value === undefined) {
    return form.append(key, '');
  }

  convert(value, form, key);
}

function toKey(parent: string | null, key: string): string {
  return parent ? `${parent}[${key}]` : key;
}
