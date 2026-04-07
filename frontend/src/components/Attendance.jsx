import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserAttendance } from '../store/slices/userSlice';
import { formatDate } from '../utils/helpers';
import styles from './Attendance.module.css';

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' }
];

function Attendance() {
  const dispatch = useDispatch();
  const { attendance, attendanceLoading, attendanceError } = useSelector((state) => state.users);
  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());

  useEffect(() => {
    dispatch(fetchUserAttendance({ month, year }));
  }, [dispatch, month, year]);

  const handleMonthChange = (e) => {
    setMonth(Number(e.target.value));
  };

  const handleYearChange = (e) => {
    setYear(Number(e.target.value));
  };

  const summary = useMemo(() => {
    if (!attendance?.records) return { totalDays: 0, leaves: 0, halfDays: 0 };
    
    const records = attendance.records;
    const totalDays = records.filter(r => r.status === 'PRESENT').length;
    const leaves = records.filter(r => r.status === 'LEAVE').length;
    const halfDays = records.filter(r => r.status === 'HALF_DAY').length;
    
    return { totalDays, leaves, halfDays };
  }, [attendance?.records]);

  const getStatusBadge = (status) => {
    const statusClasses = {
      'PRESENT': styles.statusPresent,
      'FULL_DAY': styles.statusPresent,
      'LEAVE': styles.statusLeave,
      'HALF_DAY': styles.statusHalfDay
    };
    const statusLabels = {
      'PRESENT': 'Present',
      'FULL_DAY': 'Full Day',
      'LEAVE': 'Leave',
      'HALF_DAY': 'Half Day'
    };
    return { className: statusClasses[status], label: statusLabels[status] || status };
  };

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i);

  const tableHeaders = ['Date', 'Clock-in', 'Clock-out', 'Total hours', 'Status'];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={styles.titleIcon} style={{ width: 22, height: 22 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          Attendance Details
        </h2>
        <div className={styles.filterGroup}>
          <select
            value={month}
            onChange={handleMonthChange}
            className={styles.filterSelect}
            aria-label="Select month"
          >
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={handleYearChange}
            className={styles.filterSelect}
            aria-label="Select year"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Total Days</span>
          <span className={styles.summaryValue}>{summary.totalDays}</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Leaves</span>
          <span className={`${styles.summaryValue} ${styles.warning}`}>{summary.leaves}</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Half Days</span>
          <span className={`${styles.summaryValue} ${styles.info}`}>{summary.halfDays}</span>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        {attendanceLoading ? (
          <div className={styles.loadingState}>Loading attendance...</div>
        ) : attendanceError ? (
          <div className={styles.errorState}>{attendanceError.message || 'Failed to load attendance'}</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                {tableHeaders.map((header) => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {attendance?.records?.length === 0 ? (
                <tr>
                  <td colSpan={5} className={styles.emptyState}>No attendance records found for this month</td>
                </tr>
              ) : (
                attendance?.records?.map((record) => (
                  <tr key={record.date}>
                    <td>{formatDate(record.date)}</td>
                    <td>{record.clockIn || '-'}</td>
                    <td>{record.clockOut || '-'}</td>
                    <td>{record.totalHours || '-'}</td>
                    <td>
                      {(() => {
                        const { className, label } = getStatusBadge(record.status);
                        return <span className={className}>{label}</span>;
                      })()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Attendance;