import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';

@WebSocketGateway(81, { namespace: 'chatroom' })
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  //방변수 설정
  private rooms: { [room: string]: Set<string> } = {};

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('enter')
  connectSomeone(
    @MessageBody() data: string,
    @ConnectedSocket() client: Socket,
  ) {
    const [nickname, room] = data;

    if (!this.rooms[room]) {
      this.rooms[room] = new Set();
    }
    this.rooms[room].add(nickname);

    console.log(`${nickname}님이 코드: ${room}방에 접속했습니다.`);
    const comeOn = `${nickname}님이 입장했습니다.`;
    //방에 있는 모든 사용자에게 메세지 전송
    client.join(room);
    this.server.emit('comeOn' + room, comeOn);
    // 방 사용자 목록 전송
    this.server.to(room).emit('userList' + room, Array.from(this.rooms[room]));
  }

  private broadcast(event: string, client: Socket, message: any) {
    //현재 방의 다른 사용자에게만 메세지 전송
    const rooms = Array.from(client.rooms);
    rooms.forEach((room) => {
      client.to(room).emit(event, message);
    });
  }


  @SubscribeMessage('send')
  sendMessage(
    @MessageBody() data: [string, string, string],
    @ConnectedSocket() client: Socket,
  ) {
    const [room, nickname, message] = data;

    // 방이 존재하지 않거나 방에 사용자가 없을 경우
    if (!this.rooms[room] || this.rooms[room].size === 0) {
      console.log(`Message not sent: Room "${room}" does not exist or is empty.`);
      client.emit('error', { message: `Cannot send message. Room "${room}" does not exist or is empty.` });
      return;
    }

    // nickname이 해당 방에 속해 있는지 확인
    if (!this.rooms[room].has(nickname)) {
      console.log(`Message not sent: User "${nickname}" is not in room "${room}".`);
      client.emit('error', { message: `Cannot send message. User "${nickname}" is not in room "${room}".` });
      return;
    }

    console.log(`${nickname}님이 ${room}방에 메시지를 보냈습니다: ${message}`);

    // 특정 방에 있는 모든 사용자에게 메시지 전송
    this.server.to(room).emit('message', { nickname, message });

    // console.log(`${client.id} : ${data}`);
    // this.broadcast(room, client, [nickname, message]);
  }

  @SubscribeMessage('leave')
  leaveRoom(
    @MessageBody() data: [string, string],
    @ConnectedSocket() client: Socket,
  ) {
    const [nickname, room] = data;

    // 방이 존재하지 않거나 사용자가 방에 없을 경우
    if (!this.rooms[room] || !this.rooms[room].has(nickname)) {
      console.log(`Leave failed: User "${nickname}" is not in room "${room}".`);
      client.emit('error', { message: `Cannot leave. User "${nickname}" is not in room "${room}".` });
      return;
    }
    // 방에서 사용자 제거
    this.rooms[room].delete(nickname);

    // 방이 비어 있으면 방 자체를 삭제
    if (this.rooms[room].size === 0) {
      delete this.rooms[room];
    }

    console.log(`${nickname}님이 ${room}방에서 나갔습니다.`);
    client.leave(room);

    // Broadcast to other users in the room that the user has left
    const leaveMessage = `${nickname}님이 나갔습니다.`;
    this.server.to(room).emit('leaveRoom' + { room, message: leaveMessage });

    // 갱신된 사용자 목록 전송
    const updatedUserList = Array.from(this.rooms[room] || []);
    this.server.to(room).emit('userList', { room, users: updatedUserList });
  }

  @SubscribeMessage('getUserList')
  getUserList(
    @MessageBody() room: string,
    @ConnectedSocket() client: Socket,
  ) {
    // 방이 존재하지 않으면 에러 반환
    if (!this.rooms[room]) {
      console.log(`User list request failed: Room "${room}" does not exist.`);
      client.emit('error', { message: `Room "${room}" does not exist.` });
      return;
    }

    // 방에 있는 유저 리스트 반환
    const userList = Array.from(this.rooms[room]);
    console.log(`User list for room "${room}":`, userList);
    client.emit('userList', { room, users: userList });
  }

  // 사용자 목록 반환 메서드
  getRoomUsers(room: string): string[] {
    return this.rooms[room] ? Array.from(this.rooms[room]) : [];
  }

}