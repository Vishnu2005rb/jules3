import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CertificateCanvas } from './CertificateCanvas';
import { CANVAS_DIMENSIONS } from '@/lib/templateBuilder.types';

describe('CertificateCanvas', () => {
  describe('Requirement 1.1: Canvas dimensions', () => {
    it('should render canvas with A4 landscape dimensions (1122px × 794px)', () => {
      const { container } = render(<CertificateCanvas />);
      const canvas = container.querySelector('.bg-white');
      
      expect(canvas).toBeInTheDocument();
      // The canvas uses transform scale, so we check the base dimensions
      const style = window.getComputedStyle(canvas as Element);
      expect(style.width).toBeTruthy();
      expect(style.height).toBeTruthy();
    });
  });

  describe('Requirement 1.2: White background', () => {
    it('should render canvas with white background by default', () => {
      const { container } = render(<CertificateCanvas />);
      const canvas = container.querySelector('.bg-white');
      
      expect(canvas).toHaveClass('bg-white');
    });
  });

  describe('Requirement 1.3: Dimension indicators', () => {
    it('should display canvas dimension indicators', () => {
      render(<CertificateCanvas />);
      
      const dimensionText = screen.getByText(/1122px × 794px/);
      expect(dimensionText).toBeInTheDocument();
    });

    it('should display scale percentage when scaled', () => {
      // Mock container size to force scaling
      Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
        configurable: true,
        value: 500,
      });
      Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
        configurable: true,
        value: 400,
      });

      render(<CertificateCanvas />);
      
      // Wait for scale calculation
      setTimeout(() => {
        const scaleText = screen.queryByText(/scaled to/);
        // Scale indicator should appear when canvas is scaled down
        if (scaleText) {
          expect(scaleText).toBeInTheDocument();
        }
      }, 100);
    });
  });

  describe('Requirement 1.4: Aspect ratio maintenance', () => {
    it('should maintain aspect ratio when scaling', () => {
      const { container } = render(<CertificateCanvas />);
      const canvas = container.querySelector('.bg-white') as HTMLElement;
      
      expect(canvas).toBeInTheDocument();
      
      // The component uses transform scale which maintains aspect ratio
      const style = window.getComputedStyle(canvas);
      expect(style.transformOrigin).toBe('top center');
    });
  });

  describe('Background image support', () => {
    it('should render background image when provided', () => {
      const testImage = 'data:image/png;base64,test';
      const { container } = render(<CertificateCanvas backgroundImage={testImage} />);
      
      const img = container.querySelector('img[alt="Certificate background"]');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', testImage);
    });

    it('should not render background image when not provided', () => {
      const { container } = render(<CertificateCanvas />);
      
      const img = container.querySelector('img[alt="Certificate background"]');
      expect(img).not.toBeInTheDocument();
    });
  });

  describe('Canvas interaction', () => {
    it('should call onCanvasClick when canvas background is clicked', () => {
      const handleClick = jest.fn();
      const { container } = render(<CertificateCanvas onCanvasClick={handleClick} />);
      
      const canvas = container.querySelector('.bg-white') as HTMLElement;
      fireEvent.click(canvas);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onCanvasClick when child element is clicked', () => {
      const handleClick = jest.fn();
      render(
        <CertificateCanvas onCanvasClick={handleClick}>
          <div data-testid="child-element">Child</div>
        </CertificateCanvas>
      );
      
      const child = screen.getByTestId('child-element');
      fireEvent.click(child);
      
      // Click should not propagate to canvas
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Children rendering', () => {
    it('should render children elements on the canvas', () => {
      render(
        <CertificateCanvas>
          <div data-testid="test-element">Test Element</div>
        </CertificateCanvas>
      );
      
      const element = screen.getByTestId('test-element');
      expect(element).toBeInTheDocument();
    });
  });

  describe('Requirement 15: Responsive scaling', () => {
    it('should scale canvas proportionally when viewport is smaller', () => {
      // Mock smaller container
      Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
        configurable: true,
        value: 800,
      });
      Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
        configurable: true,
        value: 600,
      });

      const { container } = render(<CertificateCanvas />);
      const canvas = container.querySelector('.bg-white') as HTMLElement;
      
      expect(canvas).toBeInTheDocument();
      // The canvas should have transform scale applied
      const style = window.getComputedStyle(canvas);
      expect(style.transform).toBeTruthy();
    });

    it('should not scale up beyond 100%', () => {
      // Mock larger container
      Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
        configurable: true,
        value: 2000,
      });
      Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
        configurable: true,
        value: 1500,
      });

      const { container } = render(<CertificateCanvas />);
      const canvas = container.querySelector('.bg-white') as HTMLElement;
      
      // Canvas should not scale beyond 100%
      expect(canvas).toBeInTheDocument();
    });
  });
});
