import { Calendar, Clock, MapPin, User } from "lucide-react";

export interface Appointment {
  id: string;
  title: string;
  date: string;
  time: string;
  location?: string;
  attendee?: string;
}

interface AppointmentCardProps {
  appointment: Appointment;
}

export function AppointmentCard({ appointment }: AppointmentCardProps) {
  return (
    <div className="bg-card rounded-xl p-5 border border-primary/30 shadow-glow animate-fade-in glow-border">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
          <Calendar className="w-4 h-4 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Appointment Confirmed</h3>
      </div>
      
      <div className="space-y-3">
        <p className="text-foreground font-medium">{appointment.title}</p>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>{appointment.date}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>{appointment.time}</span>
        </div>
        
        {appointment.location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{appointment.location}</span>
          </div>
        )}
        
        {appointment.attendee && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="w-4 h-4" />
            <span>{appointment.attendee}</span>
          </div>
        )}
      </div>
    </div>
  );
}
