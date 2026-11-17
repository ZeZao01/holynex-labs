import React from 'react';
import { IconButton } from '../core/IconButton.jsx';
import { Avatar } from '../display/Avatar.jsx';
import { Input } from '../forms/Input.jsx';
export function Topbar({ title, subtitle, leading, search, actions, user, onMenuClick, onSearchClick, className }) {
  return (
    <header className={['hn-topbar', className].filter(Boolean).join(' ')}>
      {onMenuClick ? <IconButton icon="menu" label="Abrir menu" variant="ghost" className="hn-topbar__menu" onClick={onMenuClick} /> : null}
      <div className="hn-topbar__titles">
        {leading}
        {title ? <h1 className="hn-topbar__title">{title}</h1> : null}
        {subtitle ? <p className="hn-topbar__subtitle">{subtitle}</p> : null}
      </div>
      <div className="hn-topbar__right">
        {search ? <Input className="hn-topbar__search" iconLeft="search" size="sm" placeholder={search.placeholder || 'Buscar qualquer coisa'} kbd={search.kbd || ['⌘', 'K']} value={search.value} onChange={search.onChange} /> : null}
        {search ? <IconButton icon="search" label="Buscar" className="hn-topbar__search-btn" onClick={onSearchClick} /> : null}
        {actions}
        {user ? <button type="button" className="hn-topbar__user" onClick={user.onClick} aria-label={user.name}><Avatar name={user.name} src={user.avatar} size={36} status={user.status} /></button> : null}
      </div>
    </header>
  );
}
