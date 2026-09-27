import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {validateGeneratedImage} from '../src/services/imagegen.js';

test('generated image rejects internal URLs, wrong generator and corrupt data', () => {
  const bytes = Buffer.from('89504e470d0a1a0a00000000','hex');
  const url='data:image/png;base64,'+bytes.toString('base64');
  const data={status:'completed',generator:'nightasaur-procedural-v1',images:[{url,sha256:createHash('sha256').update(bytes).digest('hex')}]};
  assert.equal(validateGeneratedImage(data),url);
  for (const bad of [ {...data,generator:'unknown'}, {...data,images:[{url:'http://localhost:8188/image'}]}, {...data,images:[{...data.images[0],sha256:'wrong'}]}]) {
    assert.throws(()=>validateGeneratedImage(bad));
  }
});
