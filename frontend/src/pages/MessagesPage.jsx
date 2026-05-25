import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiFetch, formatDate } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { useSEO, PAGE_SEO } from '../hooks/useSEO';
import { Icon, Spinner } from '../components/UI';

const POLL_INTERVAL = 4000; // poll for new messages every 4s

export default function MessagesPage() {
  const { id } = useParams();       // optional conversation id
  const navigate = useNavigate();
  const { user } = useAuth();
  useSEO({ ...PAGE_SEO.trips, title: 'Messages' });

  const [conversations, setConversations] = useState([]);
  const [active, setActive]               = useState(null);
  const [messages, setMessages]           = useState([]);
  const [body, setBody]                   = useState('');
  const [sending, setSending]             = useState(false);
  const [loading, setLoading]             = useState(true);
  const bottomRef = useRef(null);
  const pollRef   = useRef(null);

  // Load conversation list
  const loadConversations = useCallback(async () => {
    try {
      const data = await apiFetch('/messages/');
      setConversations(data);
    } catch (e) {}
  }, []);

  // Load messages for active conversation
  const loadMessages = useCallback(async (convId) => {
    try {
      const data = await apiFetch(`/messages/${convId}/`);
      setActive(data.conversation);
      setMessages(data.messages);
      // update unread badge in conversation list
      setConversations(prev =>
        prev.map(c => c.id === convId ? { ...c, unread_count: 0 } : c)
      );
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    loadConversations().finally(() => setLoading(false));
  }, [user]);

  // Open conversation from URL param
  useEffect(() => {
    if (id) loadMessages(Number(id));
  }, [id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Poll for new messages when a conversation is open
  useEffect(() => {
    if (!active) return;
    pollRef.current = setInterval(() => {
      loadMessages(active.id);
      loadConversations();
    }, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [active?.id]);

  const openConversation = (conv) => {
    navigate(`/messages/${conv.id}`);
    loadMessages(conv.id);
  };

  const sendMessage = async () => {
    if (!body.trim() || !active || sending) return;
    setSending(true);
    try {
      const msg = await apiFetch(`/messages/${active.id}/send/`, {
        method: 'POST',
        body: JSON.stringify({ body: body.trim() }),
      });
      setMessages(prev => [...prev, msg]);
      setBody('');
      loadConversations();
    } catch (e) {
      alert(e?.error || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <Spinner size={40} />
    </div>
  );

  const totalUnread = conversations.reduce((s, c) => s + (c.unread_count || 0), 0);

  return (
    <div style={{ height: 'calc(100vh - 72px)', display: 'flex', background: '#fafaf8' }}>

      {/* ── Sidebar ── */}
      <div style={{
        width: 340, flexShrink: 0, borderRight: '1px solid #e8e8e8',
        background: 'white', display: 'flex', flexDirection: 'column',
        overflowY: 'auto',
      }}>
        <div style={{ padding: '20px 20px 14px', borderBottom: '1px solid #f0f0f0' }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>
            Messages
            {totalUnread > 0 && (
              <span style={{ marginLeft: 8, background: '#E8472A', color: 'white', borderRadius: 20, fontSize: 11, fontWeight: 700, padding: '2px 8px' }}>
                {totalUnread}
              </span>
            )}
          </h1>
        </div>

        {conversations.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#aaa' }}>
            <Icon name="chat" size={36} style={{ opacity: .3, marginBottom: 12 }} />
            <p style={{ fontSize: 14 }}>No conversations yet</p>
          </div>
        ) : conversations.map(conv => {
          const isActive = active?.id === conv.id;
          return (
            <div key={conv.id} onClick={() => openConversation(conv)} style={{
              padding: '14px 18px', cursor: 'pointer', borderBottom: '1px solid #f5f5f5',
              background: isActive ? '#fff5f3' : 'white',
              borderLeft: isActive ? '3px solid #E8472A' : '3px solid transparent',
              transition: 'background .15s',
            }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                {/* Avatar */}
                <div style={{ flexShrink: 0 }}>
                  {conv.other_user_avatar ? (
                    <img src={conv.other_user_avatar} alt="" style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#E8472A', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16 }}>
                      {(conv.other_user_name || '?')[0].toUpperCase()}
                    </div>
                  )}
                </div>
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <p style={{ fontWeight: 700, fontSize: 14, margin: 0, truncate: true }}>{conv.other_user_name}</p>
                    {conv.unread_count > 0 && (
                      <span style={{ background: '#E8472A', color: 'white', borderRadius: 10, fontSize: 10, fontWeight: 700, padding: '1px 6px', flexShrink: 0 }}>
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 12, color: '#888', margin: '0 0 3px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    {conv.listing_title}
                  </p>
                  <p style={{ fontSize: 12, color: '#aaa', margin: 0, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    {conv.last_message?.body || 'No messages yet'}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Chat area ── */}
      {active ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <div style={{ padding: '14px 24px', borderBottom: '1px solid #e8e8e8', background: 'white', display: 'flex', alignItems: 'center', gap: 14 }}>
            {active.listing_image && (
              <img src={active.listing_image} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }} />
            )}
            <div>
              <p style={{ fontWeight: 700, margin: 0, fontSize: 15 }}>
                {conversations.find(c => c.id === active.id)?.other_user_name}
              </p>
              <Link to={`/listing/${active.listing}`} style={{ fontSize: 12, color: '#E8472A' }}>
                {conversations.find(c => c.id === active.id)?.listing_title}
              </Link>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map(msg => {
              const mine = msg.is_mine;
              return (
                <div key={msg.id} style={{ display: 'flex', flexDirection: mine ? 'row-reverse' : 'row', gap: 8, alignItems: 'flex-end' }}>
                  {!mine && (
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#E8472A', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                      {msg.sender_name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div style={{
                    maxWidth: '68%',
                    background: mine ? '#E8472A' : 'white',
                    color: mine ? 'white' : '#1a1a1a',
                    borderRadius: mine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    padding: '10px 14px',
                    boxShadow: '0 1px 3px rgba(0,0,0,.08)',
                    border: mine ? 'none' : '1px solid #f0f0f0',
                  }}>
                    <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>{msg.body}</p>
                    <p style={{ margin: '4px 0 0', fontSize: 11, opacity: .65, textAlign: mine ? 'right' : 'left' }}>
                      {new Date(msg.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      {mine && <span style={{ marginLeft: 4 }}>{msg.is_read ? '✓✓' : '✓'}</span>}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '14px 24px', borderTop: '1px solid #e8e8e8', background: 'white', display: 'flex', gap: 10 }}>
            <input
              value={body}
              onChange={e => setBody(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Type a message..."
              style={{ flex: 1, padding: '11px 16px', border: '1.5px solid #e8e8e8', borderRadius: 24, fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
              onFocus={e => e.target.style.borderColor = '#E8472A'}
              onBlur={e => e.target.style.borderColor = '#e8e8e8'}
            />
            <button onClick={sendMessage} disabled={!body.trim() || sending} style={{
              width: 44, height: 44, borderRadius: '50%', background: '#E8472A', color: 'white',
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: (!body.trim() || sending) ? .4 : 1, transition: 'opacity .15s', flexShrink: 0,
            }}>
              <Icon name="search" size={18} style={{ transform: 'rotate(90deg)' }} />
            </button>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: '#ccc' }}>
          <Icon name="chat" size={56} style={{ opacity: .2 }} />
          <p style={{ fontSize: 15, color: '#aaa' }}>Select a conversation to start messaging</p>
        </div>
      )}
    </div>
  );
}
