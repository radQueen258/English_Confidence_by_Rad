/**
 * ENGLISH CONFIDENCE · STUDENT CONFIGURATION
 * IMPORTANT: This file is PUBLIC when deployed to GitHub Pages.
 * Do not put future lesson topics, private student information, videos,
 * payment data, or confidential feedback here.
 *
 * HOW TO RELEASE A LESSON:
 * 1) Add its bilingual lesson content below (after its predecessor is finished).
 * 2) Change unlockedThrough to its lesson number.
 * 3) Commit changes to GitHub. The public portal will update.
 *
 * For a podcast exercise, enter its title AND a valid https:// link.
 * A lesson with missing content stays locked automatically.
 * Mark all 12 completed with unlockedThrough: 13.
 */
window.STUDENT_CONFIG = {
  unlockedThrough: 1,
  lessons: [
    {
      number: 1, type: 'live',
      pt: {
        title: 'Vamos começar por ti',
        subtitle: 'Apresentações, rotina e primeiras conversas',
        goal: 'Falares um pouco de ti, do teu dia e dos teus interesses com mais naturalidade.',
        vocabulary: [
          ['Usually', 'normalmente'], ['Actually', 'na verdade'],
          ['Enjoy', 'gostar de / apreciar'], ['Improve', 'melhorar'],
          ['Confident', 'confiante'], ['Free time', 'tempo livre']
        ],
        phrases: ['I usually start my day by…', 'One thing I really enjoy is…', 'I would like to improve my English because…'],
        prompts: ['Como descreverias um dia normal na tua vida?', 'O que gostas de fazer no teu tempo livre?', 'Em que situações gostarias de falar inglês com mais confiança?']
      },
      en: {
        title: 'Let’s start with you',
        subtitle: 'Introductions, routines and first conversations',
        goal: 'Talk about yourself, your day and your interests more naturally.',
        vocabulary: [
          ['Usually', 'most of the time'], ['Actually', 'in fact'],
          ['Enjoy', 'to like doing something'], ['Improve', 'to get better'],
          ['Confident', 'sure of yourself'], ['Free time', 'time when you are not working']
        ],
        phrases: ['I usually start my day by…', 'One thing I really enjoy is…', 'I would like to improve my English because…'],
        prompts: ['How would you describe a typical day?', 'What do you enjoy doing in your free time?', 'When would you like to speak English more confidently?']
      }
    },
    {number: 2, type: 'live', pt: null, en: null},
    {number: 3, type: 'podcast', pt: null, en: null, podcast: {title: '', url: ''}},
    {number: 4, type: 'live', pt: null, en: null},
    {number: 5, type: 'live', pt: null, en: null},
    {number: 6, type: 'podcast', pt: null, en: null, podcast: {title: '', url: ''}},
    {number: 7, type: 'live', pt: null, en: null},
    {number: 8, type: 'live', pt: null, en: null},
    {number: 9, type: 'podcast', pt: null, en: null, podcast: {title: '', url: ''}},
    {number: 10, type: 'live', pt: null, en: null},
    {number: 11, type: 'live', pt: null, en: null},
    {number: 12, type: 'podcast', pt: null, en: null, podcast: {title: '', url: ''}}
  ]
};
