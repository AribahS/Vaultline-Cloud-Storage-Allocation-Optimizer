import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { PlayPage } from './PlayPage';

afterEach(cleanup);
const renderPlay = () => render(<MemoryRouter><PlayPage /></MemoryRouter>);

describe('Play screen', () => {
  it('keeps the capacity control, displayed capacity, and placement counts in sync', () => {
    renderPlay();
    const slider = screen.getByRole('slider', { name: 'Storage capacity' }) as HTMLInputElement;
    expect(slider.value).toBe('15360');
    expect(screen.getByTestId('capacity-value').textContent).toBe('15 GB');
    const before = Number(screen.getByTestId('kept-count').textContent);
    fireEvent.change(slider, { target: { value: '10000' } });
    expect(slider.value).toBe('10000');
    expect(screen.getByTestId('capacity-value').textContent).toBe('9.77 GB');
    expect(Number(screen.getByTestId('kept-count').textContent)).toBeLessThanOrEqual(before);
    expect(Number(screen.getByTestId('kept-count').textContent) + Number(screen.getByTestId('moved-count').textContent)).toBe(12);
    expect(document.querySelectorAll('.play-page .btn-primary')).toHaveLength(1);
  });

  it('reveals the three challenge scores for the classic example', () => {
    renderPlay();
    fireEvent.click(screen.getByRole('button', { name: 'Challenge' }));
    fireEvent.change(screen.getByRole('combobox', { name: 'Sample data' }), { target: { value: 'classic' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reveal answers' }));
    expect(screen.getByTestId('challenge-results')).toBeTruthy();
    expect(screen.getByTestId('your-score').textContent).toBe('0');
    expect(screen.getByTestId('greedy-score').textContent).toBe('30');
    expect(screen.getByTestId('optimal-score').textContent).toBe('48');
    expect(document.querySelectorAll('.play-page .btn-primary')).toHaveLength(1);
  });

  it('blocks an overflowing file click and explains the remaining capacity', () => {
    renderPlay();
    fireEvent.click(screen.getByRole('button', { name: 'Challenge' }));
    fireEvent.click(screen.getByRole('button', { name: /Family_Video_2024\.mp4/ }));
    fireEvent.click(screen.getByRole('button', { name: /Research_Dataset\.db/ }));
    fireEvent.click(screen.getByRole('button', { name: /Design_Archive\.zip/ }));
    expect(screen.getByRole('alert').textContent).toContain('only 1 GB left');
  });
});
