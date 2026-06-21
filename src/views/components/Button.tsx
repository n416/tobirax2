import { html, raw } from 'hono/html'
import type { Child } from 'hono/jsx'
import { css } from 'hono/css'

interface ButtonProps {
  type?: "submit" | "button" | "reset"
  children: Child
  id?: string
  className?: string
  onclick?: string
  style?: string
  href?: string
  variant?: "primary" | "outline" | "danger" | "ghost"
  attr?: Record<string, string>
}

export const Button = (props: ButtonProps) => {
  const variant = props.variant || 'primary'
  
  const baseBtn = css`
    width: 100%;
    padding: 0.8rem 1rem;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;
    font-family: inherit;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    line-height: 1.2;
    text-decoration: none;
    box-sizing: border-box;
  `

  const primary = css`
    background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
    color: white;
    border: none;
    box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3);
        color: white;
    }
    &:active {
        transform: translateY(0);
    }
  `

  const outline = css`
    background: #ffffff;
    border: 1px solid #cbd5e1;
    color: #64748b;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    &:hover {
        border-color: #4f46e5;
        color: #4f46e5;
        background: #eff6ff;
        box-shadow: none;
    }
  `

  const ghost = css`
    background: rgba(255, 255, 255, 0.7);
    border: 1px solid #cbd5e1;
    color: var(--text-main);
    box-shadow: none;
    &:hover {
        border-color: var(--primary);
        color: var(--primary);
        background: #fff;
    }
  `

  const danger = css`
    background: #fff;
    border: 1px solid #fecaca;
    color: #dc2626;
    box-shadow: none;
    &:hover {
        background: #fef2f2;
        color: #dc2626;
    }
  `

  const variantClass = variant === 'outline' ? outline :
                       variant === 'danger' ? danger :
                       variant === 'ghost' ? ghost : primary

  const attrs = props.attr 
    ? html`${raw(Object.entries(props.attr).map(([k, v]) => `${k}="${v}"`).join(' '))}`
    : ''

  if (props.href) {
    return html`
      <a 
          href="${props.href}"
          class="${baseBtn} ${variantClass} ${props.className || ''}"
          id="${props.id || ''}"
          ${props.onclick ? html`onclick="${props.onclick}"` : ''}
          style="${props.style || ''}"
          ${attrs}
      >
          ${props.children}
      </a>
    `
  }

  return html`
    <button 
        type="${props.type || 'button'}" 
        class="${baseBtn} ${variantClass} ${props.className || ''}" 
        id="${props.id || ''}"
        ${props.onclick ? html`onclick="${props.onclick}"` : ''}
        style="${props.style || ''}"
        ${attrs}
    >
        ${props.children}
    </button>
    `
}
