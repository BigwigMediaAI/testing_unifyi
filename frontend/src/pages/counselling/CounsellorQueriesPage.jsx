import { useState, useEffect, useRef } from 'react';
import { AdminLayout } from '../../components/layouts/AdminLayout';
import { queryAPI } from '../../lib/api';
import { formatDateTime } from '../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { 
  MessageCircle, Send, User, Clock, CheckCircle, XCircle,
  MessageSquare, ArrowLeft, RefreshCw, Inbox
} from 'lucide-react';
import { toast } from 'sonner';
import { ExportButton } from '../../components/ui/export-csv';

const QUERY_STATUS = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  replied: { label: 'Replied', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  closed: { label: 'Closed', color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300' }
};

export default function CounsellorQueriesPage() {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState({ total: 0, pending: 0, replied: 0, closed: 0 });
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedQuery && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedQuery?.messages]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [queriesRes, statsRes] = await Promise.all([
        queryAPI.getCounsellorQueries(),
        queryAPI.getStats()
      ]);
      setQueries(queriesRes.data.data || []);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Failed to load queries:', err);
      toast.error('Failed to load queries');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedQuery) return;

    try {
      setSending(true);
      const res = await queryAPI.reply(selectedQuery.id, replyMessage);
      setSelectedQuery(res.data);
      setReplyMessage('');
      setQueries(prev => prev.map(q => q.id === res.data.id ? res.data : q));
      // Update stats
      setStats(prev => ({
        ...prev,
        pending: Math.max(0, prev.pending - (selectedQuery.status === 'pending' ? 1 : 0)),
        replied: prev.replied + (selectedQuery.status === 'pending' ? 1 : 0)
      }));
      toast.success('Reply sent');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const handleCloseQuery = async () => {
    if (!selectedQuery) return;

    try {
      const res = await queryAPI.updateStatus(selectedQuery.id, 'closed');
      setSelectedQuery(res.data);
      setQueries(prev => prev.map(q => q.id === res.data.id ? res.data : q));
      setStats(prev => ({
        ...prev,
        [selectedQuery.status]: Math.max(0, prev[selectedQuery.status] - 1),
        closed: prev.closed + 1
      }));
      toast.success('Query closed');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to close query');
    }
  };

  const filteredQueries = statusFilter === 'all' 
    ? queries 
    : queries.filter(q => q.status === statusFilter);

  if (selectedQuery) {
    return (
      <AdminLayout>
        <div className="space-y-4" data-testid="counsellor-query-detail">
          <Button
            variant="ghost"
            onClick={() => setSelectedQuery(null)}
            className="mb-2"
            data-testid="back-to-queries"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Queries
          </Button>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{selectedQuery.subject}</CardTitle>
                  <CardDescription>
                    From: {selectedQuery.student_name} ({selectedQuery.student_email})
                    <br />
                    Created: {formatDateTime(selectedQuery.created_at)}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={QUERY_STATUS[selectedQuery.status]?.color}>
                    {QUERY_STATUS[selectedQuery.status]?.label}
                  </Badge>
                  {selectedQuery.status !== 'closed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCloseQuery}
                      data-testid="close-query-btn"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Close
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="flex-1">
            <CardContent className="p-0">
              <ScrollArea className="h-[400px] p-4">
                <div className="space-y-4">
                  {selectedQuery.messages?.map((msg, index) => (
                    <div
                      key={msg.id || index}
                      className={`flex ${msg.sender_role !== 'student' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-4 ${
                          msg.sender_role !== 'student'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-3 w-3" />
                          <span className="text-xs font-medium">
                            {msg.sender_role === 'student' ? msg.sender_name : 'You'}
                          </span>
                          <span className="text-xs opacity-70">
                            {formatDateTime(msg.created_at)}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {selectedQuery.status !== 'closed' && (
                <form onSubmit={handleSendReply} className="p-4 border-t dark:border-slate-800">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type your reply..."
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      disabled={sending}
                      data-testid="counsellor-reply-input"
                    />
                    <Button
                      type="submit"
                      disabled={sending || !replyMessage.trim()}
                      className="bg-blue-600 hover:bg-blue-700"
                      data-testid="send-counsellor-reply-btn"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="counsellor-queries-page">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Student Queries</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              View and respond to student questions
            </p>
          </div>
          <div className="flex gap-2">
            <ExportButton
              data={queries}
              filename="student_queries"
              columns={[
                { key: 'student_name', label: 'Student Name' },
                { key: 'student_email', label: 'Student Email' },
                { key: 'subject', label: 'Subject' },
                { key: 'status', label: 'Status' },
                { key: 'created_at', label: 'Created At' },
                { key: 'updated_at', label: 'Updated At' }
              ]}
            />
            <Button variant="outline" onClick={loadData} data-testid="refresh-counsellor-queries">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Inbox className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
                <p className="text-sm text-slate-500">Total</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-amber-200 dark:border-amber-800">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.pending}</p>
                <p className="text-sm text-slate-500">Pending</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.replied}</p>
                <p className="text-sm text-slate-500">Replied</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.closed}</p>
                <p className="text-sm text-slate-500">Closed</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Queries List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-blue-600" />
                Queries
              </CardTitle>
              <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="replied">Replied</TabsTrigger>
                  <TabsTrigger value="closed">Closed</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredQueries.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                  No queries found
                </h3>
                <p className="text-slate-500 dark:text-slate-400">
                  {statusFilter === 'all' 
                    ? 'No student queries assigned to you yet.' 
                    : `No ${statusFilter} queries.`}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredQueries.map((query) => (
                  <div
                    key={query.id}
                    onClick={() => setSelectedQuery(query)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      query.status === 'pending' 
                        ? 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 hover:border-amber-400' 
                        : 'dark:border-slate-800 hover:border-blue-500/50'
                    }`}
                    data-testid={`counsellor-query-item-${query.id}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-slate-900 dark:text-white truncate">
                            {query.subject}
                          </h4>
                          {query.status === 'pending' && (
                            <span className="h-2 w-2 bg-amber-500 rounded-full animate-pulse"></span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                          From: {query.student_name}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                          {query.messages?.[query.messages.length - 1]?.content || 'No messages'}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                          <span>{formatDateTime(query.updated_at)}</span>
                          <span>•</span>
                          <span>{query.messages?.length || 0} messages</span>
                        </div>
                      </div>
                      <Badge className={QUERY_STATUS[query.status]?.color}>
                        {QUERY_STATUS[query.status]?.label}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
