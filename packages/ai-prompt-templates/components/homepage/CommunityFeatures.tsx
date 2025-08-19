'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface CommunityMember {
  id: string;
  name: string;
  avatar: string;
  role: 'contributor' | 'moderator' | 'elite';
  contributions: number;
  joined_date: string;
  expertise: string[];
}

interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  type: 'workshop' | 'hackathon' | 'meetup' | 'webinar';
  participants: number;
  max_participants: number;
  is_registered: boolean;
}

export default function CommunityFeatures() {
  const router = useRouter();
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [activeTab, setActiveTab] = useState<'members' | 'events' | 'discussions'>('members');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCommunityData();
  }, []);

  const fetchCommunityData = async () => {
    try {
      // Mock data - in production this would come from v_community_public view
      const mockMembers: CommunityMember[] = [
        {
          id: '1',
          name: 'Dr. Sarah Chen',
          avatar: '/avatars/sarah.jpg',
          role: 'contributor',
          contributions: 47,
          joined_date: '2024-01-15',
          expertise: ['Cognitive Architecture', 'Prompt Engineering', 'AI Ethics']
        },
        {
          id: '2',
          name: 'Marcus Rodriguez',
          avatar: '/avatars/marcus.jpg',
          role: 'moderator',
          contributions: 89,
          joined_date: '2023-11-20',
          expertise: ['Neural Networks', 'System Design', 'Performance Optimization']
        },
        {
          id: '3',
          name: 'Dr. Elena Petrov',
          avatar: '/avatars/elena.jpg',
          role: 'contributor',
          contributions: 34,
          joined_date: '2024-02-01',
          expertise: ['Machine Learning', 'Data Science', 'Research Methods']
        }
      ];

      const mockEvents: CommunityEvent[] = [
        {
          id: '1',
          title: 'Advanced Prompt Engineering Workshop',
          description: 'Deep dive into cognitive architecture patterns and advanced prompting techniques',
          date: '2024-03-15',
          type: 'workshop',
          participants: 23,
          max_participants: 30,
          is_registered: false
        },
        {
          id: '2',
          title: 'AI Ethics & Responsible AI Development',
          description: 'Community discussion on ethical AI development and responsible prompt engineering',
          date: '2024-03-22',
          type: 'meetup',
          participants: 45,
          max_participants: 50,
          is_registered: true
        },
        {
          id: '3',
          title: 'Prompt Engineering Hackathon',
          description: '24-hour challenge to create innovative AI prompt templates',
          date: '2024-04-01',
          type: 'hackathon',
          participants: 67,
          max_participants: 100,
          is_registered: false
        }
      ];

      setMembers(mockMembers);
      setEvents(mockEvents);
    } catch (error) {
      console.error('Failed to fetch community data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEventRegistration = async (eventId: string) => {
    try {
      // In production: call RPC for event registration
      setEvents(prev => prev.map(event => 
        event.id === eventId 
          ? { ...event, is_registered: !event.is_registered, participants: event.is_registered ? event.participants - 1 : event.participants + 1 }
          : event
      ));
    } catch (error) {
      console.error('Failed to register for event:', error);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'elite': return 'bg-red-100 text-red-800 border-red-200';
      case 'moderator': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'contributor': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'workshop': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'hackathon': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'meetup': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'webinar': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <section className="px-4 py-16 mx-auto max-w-7xl">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <div className="text-xl text-gray-600">Loading community features...</div>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 py-16 mx-auto max-w-7xl">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
          🌟 Community Hub
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Connect with AI researchers, prompt engineers, and cognitive architects
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center mb-8">
        <div className="bg-white rounded-xl p-1 shadow-lg border border-gray-200">
          {[
            { id: 'members', label: 'Members', icon: '👥' },
            { id: 'events', label: 'Events', icon: '📅' },
            { id: 'discussions', label: 'Discussions', icon: '💬' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
        {activeTab === 'members' && (
          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Community Members</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {members.map((member) => (
                <div key={member.id} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold mr-4">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800">{member.name}</h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(member.role)}`}>
                        {member.role}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">{member.contributions}</span> contributions
                    </div>
                    <div className="text-sm text-gray-500">
                      Joined {new Date(member.joined_date).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {member.expertise.map((skill, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Upcoming Events</h3>
            <div className="space-y-6">
              {events.map((event) => (
                <div key={event.id} className="bg-gradient-to-r from-gray-50 to-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getEventTypeColor(event.type)}`}>
                          {event.type}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(event.date).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <h4 className="text-xl font-semibold text-gray-800 mb-2">{event.title}</h4>
                      <p className="text-gray-600 mb-4">{event.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>👥 {event.participants}/{event.max_participants} participants</span>
                        <span>📅 {new Date(event.date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 lg:mt-0 lg:ml-6">
                      <button
                        onClick={() => handleEventRegistration(event.id)}
                        disabled={event.participants >= event.max_participants && !event.is_registered}
                        className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                          event.is_registered
                            ? 'bg-green-100 text-green-800 border border-green-200 hover:bg-green-200'
                            : event.participants >= event.max_participants
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
                        }`}
                      >
                        {event.is_registered ? 'Registered ✓' : 
                         event.participants >= event.max_participants ? 'Full' : 'Register'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'discussions' && (
          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Community Discussions</h3>
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">💬</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-800 mb-2">Discussions Coming Soon</h4>
              <p className="text-gray-600 mb-6">
                We&apos;re building a robust discussion platform for the community
              </p>
              <button
                onClick={() => router.push('/library')}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors duration-200"
              >
                Explore Library
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Community Stats */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 text-center shadow-lg border border-gray-100">
          <div className="text-3xl font-bold text-blue-600 mb-2">{members.length}+</div>
          <div className="text-gray-600">Active Members</div>
        </div>
        <div className="bg-white rounded-2xl p-6 text-center shadow-lg border border-gray-100">
          <div className="text-3xl font-bold text-purple-600 mb-2">{events.length}</div>
          <div className="text-gray-600">Upcoming Events</div>
        </div>
        <div className="bg-white rounded-2xl p-6 text-center shadow-lg border border-gray-100">
          <div className="text-3xl font-bold text-green-600 mb-2">
            {members.reduce((sum, m) => sum + m.contributions, 0)}+
          </div>
          <div className="text-gray-600">Total Contributions</div>
        </div>
        <div className="bg-white rounded-2xl p-6 text-center shadow-lg border border-gray-100">
          <div className="text-3xl font-bold text-orange-600 mb-2">24/7</div>
          <div className="text-gray-600">Community Support</div>
        </div>
      </div>
    </section>
  );
}
