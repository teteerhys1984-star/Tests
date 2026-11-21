import { it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';
import { QUESTIONS } from '../data/examData';
import { emptyAttempt, saveAttempt, loadAttempt } from '../utils/storage';

it('starts, edits, navigates and restores an in-progress student session', async () => {
 const view=render(<App/>);
 fireEvent.change(screen.getByLabelText(/What is your name/),{target:{value:'Test pupil'}});
 fireEvent.submit(screen.getByLabelText(/What is your name/).closest('form')!);
 fireEvent.change(screen.getByLabelText('Answer for 1a'),{target:{value:'his'}});
 fireEvent.click(screen.getByRole('button',{name:'Question 2, not completed'}));
 await waitFor(()=>expect(loadAttempt().currentQuestion).toBe(1));
 view.unmount(); render(<App/>);
 expect(screen.getByLabelText('Answer for 2a')).toBeTruthy();
 expect(loadAttempt().answers['1a']).toBe('his');
 expect(fetch).not.toHaveBeenCalled();
});

it('requires review, supports editing, submits, shows correction and allows retry without a new attempt', async () => {
 const answers=Object.fromEntries(QUESTIONS.flatMap(q=>q.subs.map(s=>[s.id,s.type==='text'?s.accept[0]:s.answer])));
 const a={...emptyAttempt(),status:'in-progress' as const,studentName:'Test pupil',startedAt:Date.now()-1000,answers};
 saveAttempt(a);
 vi.stubGlobal('fetch',vi.fn(async()=>({text:async()=>'{"ok":true}'})));
 render(<App/>);
 fireEvent.click(screen.getByRole('button',{name:'Review answers'}));
 expect(screen.queryByText('Your Results')).toBeNull();
 expect(screen.getByRole('region',{name:'Review answers'})).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'Edit question 20'}));
 expect(screen.getByLabelText('Answer for 20a')).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'Review answers'}));
 fireEvent.click(screen.getByRole('button',{name:'Confirm submission'}));
 expect(screen.getByText('Your Results')).toBeTruthy();
 await waitFor(()=>expect(screen.getByRole('status').textContent).toContain('success'));
 expect(loadAttempt().attemptId).toBe(a.attemptId); expect(fetch).toHaveBeenCalledTimes(1);
 expect(screen.getByRole('button',{name:'Resend result'}).hasAttribute('disabled')).toBe(true);
});

it('teacher gate is separate and returns to unchanged student welcome', () => {
 render(<App/>); fireEvent.click(screen.getByRole('button',{name:'Teacher Area'}));
 fireEvent.change(screen.getByLabelText('Password'),{target:{value:'wrong'}});
 fireEvent.click(screen.getByRole('button',{name:'Unlock'})); expect(screen.getByText(/Incorrect password/)).toBeTruthy();
 fireEvent.change(screen.getByLabelText('Password'),{target:{value:'somer173'}});
 fireEvent.click(screen.getByRole('button',{name:'Unlock'})); expect(screen.queryByLabelText('Password')).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'Back to exam'})); expect(screen.getByLabelText(/What is your name/)).toBeTruthy();expect(fetch).not.toHaveBeenCalled();
});

it('keeps results and TXT available offline and resends the same attempt without restarting', async () => {
 const a={...emptyAttempt(),status:'submitted' as const,studentName:'Test pupil',startedAt:1000,submittedAt:2000,elapsedMs:1000};
 saveAttempt(a);
 const fetchMock=vi.fn(async()=>({text:async()=>'{"ok":false}'}));vi.stubGlobal('fetch',fetchMock);
 render(<App/>);
 expect(screen.getByText('Your Results')).toBeTruthy();
 expect(screen.getAllByRole('button',{name:/Download/})[0]).toBeTruthy();
 await waitFor(()=>expect(screen.getByRole('status').textContent).toContain('failed'),{timeout:10000});
 expect(fetchMock).toHaveBeenCalledTimes(3);
 fetchMock.mockImplementation(async()=>({text:async()=>'{"duplicate":true}'}));
 fireEvent.click(screen.getByRole('button',{name:'Resend result'}));
 await waitFor(()=>expect(screen.getByRole('status').textContent).toContain('success'));
 expect(loadAttempt().attemptId).toBe(a.attemptId);
},15000);
